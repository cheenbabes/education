"""Topic-safety check for lesson generation.

Pipeline:
  1. OpenAI `/v1/moderations` pre-filter (omni-moderation-latest). Free, ~100-
     200ms. Hard-blocks clear-cut unsafe categories (sexual/minors,
     self-harm instructions) and high-confidence hits on adult harm buckets.
  2. For the ambiguous middle — moderations didn't flag but we still want K-12
     judgment — call the existing `gpt-4.1-mini` classifier to decide
     SAFE/UNSAFE with a child-specific rubric.

Why hybrid: the moderations endpoint is tuned for adult-internet harm, not
K-12 appropriateness. It won't flag "how do guns work" which may be fine for
a civics lesson, or flag "bullying" which absolutely should be teachable in
a social-emotional context. We use moderations to fail fast on the obvious
cases (so typing feels instant for most queries) and let the LLM adjudicate
the grey zone.
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from config import settings

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Moderations pre-filter
# ─────────────────────────────────────────────────────────────────────────────

# Hard-block if any of these categories trip the boolean flag — regardless of
# score. These are never OK for a K-12 lesson, no nuance to adjudicate.
_ABSOLUTE_BLOCK_CATEGORIES = (
    "sexual/minors",
    "self-harm/instructions",
)

# Hard-block if the score on any of these exceeds its threshold. The boolean
# flag tends to be overly strict; using scores lets us allow marginal hits on
# e.g. "bullying" (harassment ~0.3) while still blocking on high-conf sexual
# or graphic violence. Tuned conservatively — a false block here just tells
# the user to pick another topic; a false allow lets an unsafe lesson through.
_SCORE_BLOCK_THRESHOLDS = {
    "sexual": 0.5,
    "violence/graphic": 0.5,
    "hate": 0.5,
    "hate/threatening": 0.5,
    "illicit": 0.5,
    "illicit/violent": 0.5,
}

# Hard-block copy — deliberately generic so users don't feel interrogated.
_BLOCKED_REASON = "This topic isn't appropriate for a K-12 lesson. Please choose a different subject."


class _PrefilterResult:
    __slots__ = ("decision", "reason", "hit_category", "max_score")

    def __init__(
        self,
        decision: str,  # "block" | "pass" | "error"
        reason: str | None = None,
        hit_category: str | None = None,
        max_score: float = 0.0,
    ):
        self.decision = decision
        self.reason = reason
        self.hit_category = hit_category
        self.max_score = max_score


def _run_moderations_prefilter(interest: str) -> _PrefilterResult:
    """Call /v1/moderations. Returns a decision tuple.

    - "block" → skip the LLM, reject immediately
    - "pass"  → fall through to the LLM classifier for K-12 judgment
    - "error" → moderations endpoint was unavailable; fall through to LLM
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.moderations.create(
            model=settings.openai_moderation_model,
            input=interest,
        )
    except Exception as e:
        logger.warning("moderations_prefilter_failed error=%r", e)
        return _PrefilterResult(decision="error")

    if not resp.results:
        return _PrefilterResult(decision="error")

    result = resp.results[0]
    # Both `categories` and `category_scores` are pydantic objects whose field
    # names use underscores even when the API uses slashes, so we normalise.
    categories = result.categories.model_dump() if hasattr(result.categories, "model_dump") else dict(result.categories)
    scores = result.category_scores.model_dump() if hasattr(result.category_scores, "model_dump") else dict(result.category_scores)

    def _get(d: dict, slash_name: str):
        # Try the API canonical name first, then its underscore variant.
        return d.get(slash_name) if slash_name in d else d.get(slash_name.replace("/", "_").replace("-", "_"))

    max_score = max((v for v in scores.values() if isinstance(v, (int, float))), default=0.0)

    # 1. Absolute-block categories — no nuance.
    for cat in _ABSOLUTE_BLOCK_CATEGORIES:
        if _get(categories, cat):
            return _PrefilterResult(
                decision="block",
                reason=_BLOCKED_REASON,
                hit_category=cat,
                max_score=max_score,
            )

    # 2. Score-threshold blocks.
    for cat, threshold in _SCORE_BLOCK_THRESHOLDS.items():
        score = _get(scores, cat)
        if isinstance(score, (int, float)) and score >= threshold:
            return _PrefilterResult(
                decision="block",
                reason=_BLOCKED_REASON,
                hit_category=cat,
                max_score=max_score,
            )

    return _PrefilterResult(decision="pass", max_score=max_score)


# ─────────────────────────────────────────────────────────────────────────────
# LLM classifier (existing path, factored out)
# ─────────────────────────────────────────────────────────────────────────────

def _moderation_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost using litellm's live pricing table (no hardcoded rates)."""
    try:
        import litellm
        mc = litellm.model_cost.get(model, {})
        if mc:
            return (
                mc.get("input_cost_per_token", 0) * input_tokens
                + mc.get("output_cost_per_token", 0) * output_tokens
            )
    except Exception:
        pass
    # Fallback
    if "mini" in model:
        return (input_tokens * 0.40 + output_tokens * 1.60) / 1_000_000
    return (input_tokens * 0.80 + output_tokens * 4.0) / 1_000_000


def _run_llm_classifier(interest: str) -> tuple[bool, str | None, str, int, int, float]:
    """Returns (safe, reason, model_used, input_tokens, output_tokens, cost_usd)."""
    prompt = (
        "Classify this lesson topic as SAFE or UNSAFE for children ages 5-18 in a K-12 "
        "educational context.\n"
        "UNSAFE means the topic involves sexual content, graphic violence, drugs or alcohol, "
        "hate speech, self-harm, or anything not appropriate for K-12 education.\n"
        "Respond with only 'SAFE' or 'UNSAFE' followed by a brief reason (one sentence max).\n\n"
        f"Topic: {interest}"
    )

    input_tokens = 0
    output_tokens = 0

    if settings.generation_provider == "openai":
        from openai import OpenAI
        model_used = settings.openai_validation_model
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=model_used,
            max_tokens=64,
            temperature=0,  # determinism — the eval harness caught drift on borderline topics
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.choices[0].message.content or ""
        if response.usage:
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
    else:
        import anthropic
        model_used = settings.haiku_model
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model=model_used,
            max_tokens=64,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text if message.content else ""
        input_tokens = message.usage.input_tokens
        output_tokens = message.usage.output_tokens

    cost_usd = _moderation_cost(model_used, input_tokens, output_tokens)
    text = text.strip()
    safe = text.upper().startswith("SAFE")
    reason = text.split(" ", 1)[1].lstrip(":- ").strip() if " " in text else None
    return safe, reason or None, model_used, input_tokens, output_tokens, cost_usd


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI endpoint
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter()


class CheckTopicRequest(BaseModel):
    interest: str


class CheckTopicResponse(BaseModel):
    safe: bool
    reason: str | None = None


@router.post("/check-topic", response_model=CheckTopicResponse)
async def check_topic(req: CheckTopicRequest) -> CheckTopicResponse:
    """Classify a lesson topic as safe or unsafe for K-12 children.

    Two-stage: fast free moderations pre-filter, then LLM judgment on the
    grey zone. Pre-filter can be disabled via MODERATIONS_PREFILTER_ENABLED=0.
    """
    interest = req.interest.strip()
    if not interest:
        return CheckTopicResponse(safe=False, reason="No topic provided.")

    # Stage 1: moderations pre-filter (fast path)
    if settings.moderations_prefilter_enabled:
        pre = _run_moderations_prefilter(interest)
        if pre.decision == "block":
            logger.info(
                "moderation_check topic=%r safe=False path=prefilter hit_category=%s max_score=%.3f",
                interest[:60], pre.hit_category, pre.max_score,
            )
            return CheckTopicResponse(safe=False, reason=pre.reason)
        # pass / error both fall through to the LLM

    # Stage 2: LLM K-12 judgment
    safe, reason, model_used, input_tokens, output_tokens, cost_usd = _run_llm_classifier(interest)
    logger.info(
        "moderation_check topic=%r safe=%s path=llm model=%s input_tokens=%d output_tokens=%d cost_usd=%.6f",
        interest[:60], safe, model_used, input_tokens, output_tokens, cost_usd,
    )
    return CheckTopicResponse(safe=safe, reason=reason)
