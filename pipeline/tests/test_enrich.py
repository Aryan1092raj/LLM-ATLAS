import unittest
from pipeline.enrich.enrich import extract_specs, classify_family, is_open_weight_model, compute_confidence


class TestEnrich(unittest.TestCase):
    def test_extract_specs_gqa(self):
        config = {
            "model_type": "llama",
            "num_hidden_layers": 32,
            "hidden_size": 4096,
            "num_attention_heads": 32,
            "num_key_value_heads": 8,
            "max_position_embeddings": 131072,
            "rope_theta": 500000.0,
            "vocab_size": 128256,
        }
        specs = extract_specs(config, "2026-07-30")
        self.assertEqual(specs["attention_type"], "GQA")
        self.assertEqual(specs["num_attention_heads"], 32)
        self.assertEqual(specs["num_key_value_heads"], 8)

    def test_extract_specs_moe(self):
        config = {
            "model_type": "deepseek",
            "num_hidden_layers": 61,
            "num_local_experts": 256,
            "num_experts_per_tok": 8,
        }
        specs = extract_specs(config, "2026-07-30")
        self.assertEqual(specs["num_local_experts"], 256)
        self.assertEqual(specs["attention_type"], "MLA")

    def test_classify_family(self):
        self.assertEqual(classify_family("Mixtral-8x7B", {"num_local_experts": 8}, None), "moe")
        self.assertEqual(classify_family("Falcon3-Mamba-7B", {"model_type": "mamba"}, None), "hybrid_attention_ssm")

    def test_compute_confidence(self):
        self.assertEqual(compute_confidence("open_weight", {"num_hidden_layers": 32}), "verified")
        self.assertEqual(compute_confidence("closed_undisclosed", {}, "https://openai.com/index/gpt-4o"), "reported")
        self.assertEqual(compute_confidence("closed_undisclosed", {}, "https://openrouter.ai/models/gpt-4o"), "undisclosed")


if __name__ == "__main__":
    unittest.main()
