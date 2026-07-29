"""
Entity resolution per TRD §5.2.

Two stages:
  1. Name normalization — lowercase, strip provider prefix, strip date/version
     suffixes, strip parenthetical tags.
  2. Matching — exact match against known aliases, then fuzzy match against
     canonical names with a configurable threshold (default 0.85).

Fuzzy scoring uses stdlib `difflib.SequenceMatcher` (Levenshtein-like ratio).
This avoids a hard dependency on rapidfuzz while still satisfying the
"Levenshtein or embedding cosine similarity" requirement in the TRD.

Public surface:
    normalize_name(s) -> str
    exact_match(candidate, aliases) -> Optional[str]
    fuzzy_match(candidate, canonical_names, threshold) -> Optional[(name, score)]
    resolve(candidate, canonical, aliases, threshold) -> ResolveResult
"""
from __future__ import annotations

import difflib
import re
from dataclasses import dataclass
from typing import Iterable, Optional


# Default threshold per TRD §5.2 and taste (Confidence: 0.75).
DEFAULT_THRESHOLD = 0.85


# ---------------------------------------------------------------------------
# Name normalization
# ---------------------------------------------------------------------------

# Common provider / org prefixes seen in Hugging Face + OpenRouter ids.
# Each alternative requires a trailing "/" so we never strip a bare name
# that just happens to start with a vendor string (e.g., "Qwen2.5-...").
PROVIDER_PREFIX = re.compile(
    r"^(?:"
    r"openai/|"
    r"meta-llama/|"
    r"anthropic/|"
    r"google/|"
    r"deepseek/|"
    r"deepseek-ai/|"
    r"mistralai/|"
    r"mistral/|"
    r"qwen/|"
    r"tiiuae/|"
    r"nanbeige/"
    r")",
    re.IGNORECASE,
)

# Date / version suffixes: "-2024-04-09", "-v1.0", "-1.5", etc.
SUFFIX_PATTERN = re.compile(
    r"(?:[-_](?:v?\d+(?:[._-]\d+){0,3}|\d{4}-\d{2}-\d{2}))$",
    re.IGNORECASE,
)

# Parenthetical tags at end of name: "(base)", "(Instruct)", etc.
PARENTHETICAL = re.compile(r"\s*\([^)]*\)\s*$")

# Whitespace + common separators to collapse into a single hyphen.
# Includes ":" because OpenRouter names sometimes use "Vendor: Model" form.
WS = re.compile(r"[\s_\-:]+")


def normalize_name(s: str) -> str:
    """Normalize a model name for matching. Idempotent."""
    if not s:
        return ""
    s = s.strip()
    # Strip provider prefix (and the trailing slash, if any).
    s = PROVIDER_PREFIX.sub("", s)
    if s.startswith("/"):
        s = s[1:]
    # Strip parenthetical tags.
    s = PARENTHETICAL.sub("", s)
    # Strip trailing date/version suffix.
    s = SUFFIX_PATTERN.sub("", s)
    # Collapse whitespace + common separators to a single hyphen.
    s = WS.sub("-", s.lower()).strip("-")
    return s


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

@dataclass
class ResolveResult:
    matched: bool
    canonical_name: Optional[str] = None
    matched_as_alias: bool = False
    confidence: float = 0.0
    normalized: str = ""

    def __bool__(self) -> bool:
        return self.matched


def _score(a: str, b: str) -> float:
    """SequenceMatcher ratio on already-normalized strings."""
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def exact_match(candidate_norm: str, aliases: dict[str, str]) -> Optional[str]:
    """Return canonical name if candidate matches any normalized alias."""
    return aliases.get(candidate_norm)


def fuzzy_match(
    candidate_norm: str,
    canonical_names: Iterable[str],
    threshold: float = DEFAULT_THRESHOLD,
) -> Optional[tuple[str, float]]:
    """Find the best fuzzy match above threshold. Returns (canonical, score)."""
    best_name: Optional[str] = None
    best_score: float = 0.0
    for c in canonical_names:
        s = _score(candidate_norm, c)
        if s > best_score:
            best_score = s
            best_name = c
    if best_name is not None and best_score >= threshold:
        return best_name, best_score
    return None


def resolve(
    candidate: str,
    canonical: dict[str, dict],      # normalized_name -> record (mutable)
    aliases: dict[str, str],         # normalized_alias -> normalized_canonical
    threshold: float = DEFAULT_THRESHOLD,
) -> ResolveResult:
    """Run the full §5.2 resolution pipeline for one candidate name."""
    norm = normalize_name(candidate)

    # 1. Exact alias match (already normalized in the alias map).
    exact = exact_match(norm, aliases)
    if exact is not None:
        return ResolveResult(
            matched=True,
            canonical_name=exact,
            matched_as_alias=True,
            confidence=1.0,
            normalized=norm,
        )

    # 2. Fuzzy match against canonical name list (also pre-normalized).
    canonical_norm_keys = list(canonical.keys())
    fuzzy = fuzzy_match(norm, canonical_norm_keys, threshold=threshold)
    if fuzzy is not None:
        name, score = fuzzy
        return ResolveResult(
            matched=True,
            canonical_name=name,
            matched_as_alias=False,
            confidence=score,
            normalized=norm,
        )

    # 3. No match — genuinely new.
    return ResolveResult(matched=False, normalized=norm)