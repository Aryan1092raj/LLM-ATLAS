import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from pipeline.fetchers import arena

def test_fetch_preserves_zero_and_fallback_scores():
    rows = [
        {
            "model_name": "model_zero",
            "rating": 0,
            "score": 100,
            "elo": 200,
        },
        {
            "model_name": "model_score",
            "rating": None,
            "score": 100,
            "elo": 200,
        },
        {
            "model_name": "model_elo",
            "rating": None,
            "score": None,
            "elo": 200,
        },
        {
            "model_name": "model_none",
            "rating": None,
            "score": None,
            "elo": None,
        },
    ]

    mock_df = SimpleNamespace(
        iterrows=lambda: enumerate(rows)
    )
    mock_pandas = SimpleNamespace(
        read_parquet=lambda _: mock_df
    )

    with (
        patch.object(arena, "CONFIGS", ["text"]),
        patch.object(arena, "http_get", return_value=b"fake parquet"),
        patch.dict(sys.modules, {"pandas": mock_pandas}),
    ):
        records = arena.fetch()

    scores = {
        record["model_name"]: record["score"]
        for record in records
    }

    assert scores == {
        "model_zero": 0.0,
        "model_score": 100.0,
        "model_elo": 200.0,
    }
    assert "model_none" not in scores

if __name__ == "__main__":
    test_fetch_preserves_zero_and_fallback_scores()
    print("All Arena regression tests passed!")