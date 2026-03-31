import logging
from fastapi import APIRouter
from pydantic import BaseModel
from config import settings

logger = logging.getLogger(__name__)

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

router = APIRouter()


class CheckTopicRequest(BaseModel):
    interest: str


class CheckTopicResponse(BaseModel):
    safe: bool
    reason: str | None = None


@router.post("/check-topic", response_model=CheckTopicResponse)
async def check_topic(req: CheckTopicRequest) -> CheckTopicResponse:
    """Classify a lesson topic as safe or unsafe for K-12 children."""
    interest = req.interest.strip()
    if not interest:
        return CheckTopicResponse(safe=False, reason="No topic provided.")

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
    model_used = ""

    if settings.generation_provider == "openai":
        from openai import OpenAI
        model_used = settings.openai_validation_model
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=model_used,
            max_tokens=64,
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
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text if message.content else ""
        input_tokens = message.usage.input_tokens
        output_tokens = message.usage.output_tokens

    cost_usd = _moderation_cost(model_used, input_tokens, output_tokens)
    # TODO: persist moderation costs to DB (alongside lesson generation costs) once
    # a cost-tracking table exists — tokens + model + timestamp are all we need.
    logger.info(
        "moderation_check topic=%r safe=%s model=%s input_tokens=%d output_tokens=%d cost_usd=%.6f",
        interest[:60], text.upper().startswith("SAFE"), model_used, input_tokens, output_tokens, cost_usd,
    )

    text = text.strip()
    safe = text.upper().startswith("SAFE")
    reason = text.split(" ", 1)[1].lstrip(":- ").strip() if " " in text else None
    return CheckTopicResponse(safe=safe, reason=reason or None)
