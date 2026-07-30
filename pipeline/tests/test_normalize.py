import unittest
from pipeline.resolve.normalize import normalize_name, exact_match, fuzzy_match


class TestNormalize(unittest.TestCase):
    def test_normalize_name(self):
        self.assertEqual(normalize_name("Meta-Llama-3-8B-Instruct"), "meta-llama-3-8b-instruct")
        self.assertEqual(normalize_name("GPT-4o mini"), "gpt-4o-mini")

    def test_exact_match(self):
        aliases = {"gpt-4o": "openai/gpt-4o", "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet"}
        self.assertEqual(exact_match("gpt-4o", aliases), "openai/gpt-4o")
        self.assertIsNone(exact_match("nonexistent-model", aliases))

    def test_fuzzy_match(self):
        canonical = ["Llama-3-8B-Instruct", "Claude-3-Opus"]
        match = fuzzy_match("Llama-3-8B-Instruct", canonical, threshold=0.8)
        self.assertIsNotNone(match)
        self.assertEqual(match[0], "Llama-3-8B-Instruct")


if __name__ == "__main__":
    unittest.main()
