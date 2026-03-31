"""Keyword-based semantic search for educational standards.

Implements a lightweight NLP pipeline:
  1. Tokenise and normalise the query
  2. Expand tokens with a synonym / related-term dictionary (education domain)
  3. Apply simple stemming (suffix stripping)
  4. Score each standard by weighted keyword hits across its fields
  5. Return results sorted by descending relevance score
"""

from __future__ import annotations

import math
import re
from collections import defaultdict

# ---------------------------------------------------------------------------
# Synonym / related-term dictionary  (education domain)
# Maps a canonical term to a set of related words that should also match.
# ---------------------------------------------------------------------------
_SYNONYMS: dict[str, list[str]] = {
    # Math concepts
    "add": ["addition", "sum", "plus", "addend"],
    "subtract": ["subtraction", "minus", "difference", "take away"],
    "multiply": ["multiplication", "times", "product", "factor"],
    "divide": ["division", "quotient", "divisor", "dividend", "remainder"],
    "fraction": ["fractions", "numerator", "denominator", "half", "halves", "third", "quarter", "eighth"],
    "decimal": ["decimals", "tenths", "hundredths", "thousandths", "decimal point"],
    "geometry": ["geometric", "shape", "shapes", "angle", "angles", "polygon", "triangle", "rectangle", "circle", "quadrilateral"],
    "measure": ["measurement", "measuring", "length", "width", "height", "weight", "volume", "capacity", "area", "perimeter"],
    "number": ["numbers", "numeral", "digit", "counting", "quantity"],
    "place value": ["ones", "tens", "hundreds", "thousands", "place-value"],
    "equation": ["equations", "expression", "expressions", "equal", "equality"],
    "graph": ["graphs", "graphing", "chart", "plot", "data", "table", "tally"],
    "pattern": ["patterns", "sequence", "sequences", "repeating", "growing"],
    "money": ["coins", "dollars", "cents", "currency", "price"],
    "time": ["clock", "hour", "minute", "elapsed", "calendar", "schedule"],

    # ELA concepts
    "read": ["reading", "reader", "comprehension", "text", "passage"],
    "write": ["writing", "writer", "compose", "composition", "draft", "essay"],
    "phonics": ["phonemic", "phoneme", "phonological", "sound", "sounds", "decoding", "blending"],
    "vocabulary": ["words", "word", "meaning", "definition", "context clues"],
    "grammar": ["sentence", "sentences", "punctuation", "capitalization", "parts of speech", "noun", "verb", "adjective"],
    "story": ["stories", "narrative", "fiction", "literature", "plot", "character", "setting"],
    "opinion": ["argument", "persuade", "persuasive", "claim", "evidence", "reasons"],
    "inform": ["informational", "informative", "expository", "nonfiction", "non-fiction", "explain"],
    "fluency": ["fluent", "accuracy", "expression", "prosody"],
    "spell": ["spelling", "speller"],

    # Science concepts
    "animal": ["animals", "organism", "organisms", "species", "wildlife", "creature"],
    "plant": ["plants", "vegetation", "photosynthesis", "seed", "seeds", "flower", "root"],
    "habitat": ["habitats", "ecosystem", "environment", "biome"],
    "weather": ["climate", "temperature", "precipitation", "storm", "season", "seasons"],
    "earth": ["rocks", "minerals", "soil", "erosion", "landform", "volcano", "earthquake"],
    "force": ["forces", "motion", "push", "pull", "gravity", "friction", "energy"],
    "matter": ["solid", "liquid", "gas", "states of matter", "material", "property", "properties"],
    "life cycle": ["lifecycle", "growth", "metamorphosis", "stages", "reproduction"],
    "space": ["solar system", "planet", "planets", "star", "stars", "sun", "moon", "orbit"],
    "water": ["water cycle", "evaporation", "condensation", "precipitation", "ocean", "river"],
    "sound": ["vibration", "wave", "waves", "pitch", "volume"],
    "light": ["shadow", "reflection", "refraction", "optic", "transparent", "opaque"],
    "electricity": ["electric", "circuit", "battery", "conductor", "insulator", "magnet", "magnetic"],
}

# Build a reverse lookup: token -> set of canonical tokens it maps to
_TOKEN_TO_CANONICAL: dict[str, set[str]] = defaultdict(set)
for _canon, _syns in _SYNONYMS.items():
    for _canon_word in _canon.split():
        _TOKEN_TO_CANONICAL[_canon_word].add(_canon)
    for _syn_phrase in _syns:
        for _syn_word in _syn_phrase.split():
            _TOKEN_TO_CANONICAL[_syn_word].add(_canon)


# ---------------------------------------------------------------------------
# Text processing helpers
# ---------------------------------------------------------------------------

_STOP_WORDS = frozenset(
    "a an the is are was were be been being have has had do does did "
    "will would shall should may might can could of in on at to for "
    "with by from and or not no nor but if then so that this these "
    "those it its they them their what which who whom how about into "
    "over after before between under above each every all both few "
    "more most other some such than too very just also still already "
    "use using used".split()
)

_WORD_RE = re.compile(r"[a-z0-9]+(?:[-'][a-z0-9]+)*")


def _tokenise(text: str) -> list[str]:
    """Lowercase, extract word tokens, remove stop words."""
    return [w for w in _WORD_RE.findall(text.lower()) if w not in _STOP_WORDS]


def _stem(word: str) -> str:
    """Very simple suffix-stripping stemmer (English, education domain).

    Not as accurate as Porter/Snowball but has zero dependencies and handles
    the most common suffixes found in standards descriptions.
    """
    if len(word) <= 3:
        return word
    # Order matters: try longest suffixes first
    for suffix, min_stem in [
        ("ational", 2), ("isation", 2), ("ization", 2),
        ("fulness", 2), ("ousness", 2), ("iveness", 2),
        ("tion", 3), ("sion", 3), ("ment", 3), ("ness", 3),
        ("ence", 3), ("ance", 3), ("ible", 3), ("able", 3),
        ("ling", 3), ("ting", 3), ("ing", 3),
        ("ies", 2), ("ied", 2),
        ("ous", 3), ("ive", 3), ("ful", 3),
        ("ion", 3), ("ist", 3),
        ("al", 3), ("ly", 3), ("er", 3), ("ed", 3),
        ("es", 3), ("en", 3),
        ("s", 3),
    ]:
        if word.endswith(suffix) and len(word) - len(suffix) >= min_stem:
            return word[: -len(suffix)]
    return word


def _expand_query_tokens(tokens: list[str]) -> dict[str, float]:
    """Expand raw query tokens using synonym dictionary.

    Returns a dict of {stem: weight} where original query tokens have weight 1.0
    and synonym-expanded tokens have weight 0.6.
    """
    weighted: dict[str, float] = {}

    # Original tokens get full weight
    for tok in tokens:
        stem = _stem(tok)
        weighted[stem] = max(weighted.get(stem, 0), 1.0)
        # Also add the un-stemmed form in case stemming is too aggressive
        weighted[tok] = max(weighted.get(tok, 0), 1.0)

    # Expand via synonyms
    for tok in tokens:
        canonical_set = _TOKEN_TO_CANONICAL.get(tok, set())
        for canon in canonical_set:
            # Add all words in the canonical phrase and its synonyms
            for related_phrase in [canon] + _SYNONYMS.get(canon, []):
                for related_word in related_phrase.split():
                    if related_word not in _STOP_WORDS:
                        stem = _stem(related_word)
                        weighted[stem] = max(weighted.get(stem, 0), 0.6)
                        weighted[related_word] = max(weighted.get(related_word, 0), 0.6)

    return weighted


# ---------------------------------------------------------------------------
# Scoring engine
# ---------------------------------------------------------------------------

# Field weights: how much a match in each field contributes
_FIELD_WEIGHTS = {
    "description_plain": 3.0,
    "description": 2.0,
    "domain": 1.5,
    "cluster": 1.5,
    "code": 1.0,
}

# Minimum score to include in results
_MIN_SCORE = 0.05


def _score_single(
    query_tokens: dict[str, float],
    standard: dict,
) -> float:
    """Score a single standard against the expanded query tokens.

    Uses a TF-like approach: for each query token, check if it appears
    (exact or stemmed) in each text field of the standard. Weight by
    field importance and token weight. Normalise by the number of
    query tokens so that longer queries don't automatically score higher.
    """
    total = 0.0
    max_possible = 0.0

    for field, field_weight in _FIELD_WEIGHTS.items():
        text = standard.get(field) or ""
        field_tokens = _tokenise(text)
        field_stems = {_stem(t) for t in field_tokens}
        # Also keep raw tokens for exact matching
        field_raw = set(field_tokens)

        for q_token, q_weight in query_tokens.items():
            q_stem = _stem(q_token)
            contribution = q_weight * field_weight

            if q_token in field_raw or q_stem in field_stems:
                total += contribution
            max_possible += contribution

    if max_possible == 0:
        return 0.0

    return total / max_possible


def score_standards(
    query: str,
    standards: list[dict],
    min_score: float = _MIN_SCORE,
    max_results: int = 50,
) -> list[dict]:
    """Score and rank standards against a natural-language query.

    Parameters
    ----------
    query : str
        Natural-language search query from the user.
    standards : list[dict]
        Flat list of standard dicts (must have at least ``code``,
        ``description``, ``description_plain``).
    min_score : float
        Minimum relevance score (0-1) to include in results.
    max_results : int
        Maximum number of results to return.

    Returns
    -------
    list[dict]
        Standards with an added ``score`` field, sorted descending by score.
    """
    raw_tokens = _tokenise(query)
    if not raw_tokens:
        return []

    expanded = _expand_query_tokens(raw_tokens)

    scored = []
    for std in standards:
        s = _score_single(expanded, std)
        if s >= min_score:
            scored.append({**std, "score": round(s, 4)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:max_results]
