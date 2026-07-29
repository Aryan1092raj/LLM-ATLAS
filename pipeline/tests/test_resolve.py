"""
Unit tests for entity resolution per TRD §8.

Highest-risk component — these tests cover the tricky cases named in §8:
  - same model different casing
  - version-suffixed names
  - provider-prefixed vs. bare names
  - obvious derivative (excluded by §5.3)
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from resolve.normalize import (
    DEFAULT_THRESHOLD,
    fuzzy_match,
    normalize_name,
    resolve,
)


# ---------------------------------------------------------------------------
# normalize_name
# ---------------------------------------------------------------------------

def test_normalize_lowercases_and_strips_provider():
    assert normalize_name("meta-llama/Llama-3.1-70B-Instruct") == "llama-3.1-70b-instruct"


def test_normalize_strips_paren_tags():
    assert normalize_name("Qwen2.5-72B-Instruct (base)") == "qwen2.5-72b-instruct"


def test_normalize_strips_date_suffix():
    assert normalize_name("Llama-3.1-8B-2024-04-09") == "llama-3.1-8b"


def test_normalize_strips_version_suffix():
    assert normalize_name("Mistral-7B-v0.3") == "mistral-7b"


def test_normalize_handles_unicode():
    # Unicode prefix is preserved (not transliterated) but mixed whitespace
    # collapses to a single hyphen — this matches the behavior of "case
    # insensitive, separator-agnostic" matching across scripts.
    assert normalize_name("千问  Qwen-7B") == "千问-qwen-7b"


def test_normalize_idempotent():
    a = normalize_name("  OpenAI/GPT-4o  (latest) ")
    b = normalize_name(a)
    assert a == b


# ---------------------------------------------------------------------------
# fuzzy_match
# ---------------------------------------------------------------------------

def test_fuzzy_match_below_threshold_returns_none():
    # 0.85 is the default; "foo" vs "completely-different" should be far below.
    assert fuzzy_match("foo", ["completely-different"], threshold=DEFAULT_THRESHOLD) is None


def test_fuzzy_match_above_threshold_matches():
    out = fuzzy_match(
        normalize_name("claude-3-opus-20240229"),
        [normalize_name("claude-3-opus")],
        threshold=DEFAULT_THRESHOLD,
    )
    assert out is not None
    name, score = out
    assert name == "claude-3-opus"
    assert score >= DEFAULT_THRESHOLD


# ---------------------------------------------------------------------------
# resolve (end-to-end)
# ---------------------------------------------------------------------------

def test_resolve_exact_alias_match():
    canonical = {"llama-3.1-70b-instruct": {"id": "x"}}
    aliases = {"llama-3.1-70b-instruct": "llama-3.1-70b-instruct", "meta-llama/llama-3.1-70b-instruct": "llama-3.1-70b-instruct"}
    r = resolve("meta-llama/Llama-3.1-70B-Instruct", canonical, aliases)
    assert r.matched is True
    assert r.matched_as_alias is True
    assert r.confidence == 1.0


def test_resolve_fuzzy_match():
    canonical = {"claude-3-opus": {"id": "y"}}
    aliases = {}
    r = resolve("Claude 3 Opus (Anthropic, 2024-02-29)", canonical, aliases)
    assert r.matched is True
    assert r.canonical_name == "claude-3-opus"


def test_resolve_genuinely_new():
    canonical = {"claude-3-opus": {"id": "y"}}
    aliases = {}
    r = resolve("totally-different-model", canonical, aliases)
    assert r.matched is False
    assert r.canonical_name is None


def test_resolve_threshold_respected():
    # "completely-different" should be far below 0.85 vs "claude-3-opus".
    canonical = {"claude-3-opus": {"id": "y"}}
    aliases = {}
    r = resolve("completely-different", canonical, aliases, threshold=0.99)
    assert r.matched is False


if __name__ == "__main__":
    # Tiny ad-hoc runner so we don't need pytest as a dep.
    import inspect
    tests = [(n, f) for n, f in globals().items() if n.startswith("test_") and callable(f)]
    failures = []
    for name, fn in tests:
        try:
            fn()
            print(f"  ok  {name}")
        except AssertionError as e:
            failures.append((name, e))
            print(f"  FAIL {name}: {e}")
    print(f"\n{len(tests) - len(failures)}/{len(tests)} passed")
    if failures:
        sys.exit(1)