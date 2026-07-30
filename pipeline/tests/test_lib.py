import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
import json

from pipeline.lib import http_get, fetch_json, RunStats, today, now


class TestPipelineLib(unittest.TestCase):
    def test_today_and_now_formats(self):
        self.assertRegex(today(), r"^\d{4}-\d{2}-\d{2}$")
        self.assertIn("Z", now())

    def test_run_stats_serialization(self):
        stats = RunStats(source="test_source")
        stats.new_models_found = 5
        stats.matched_to_existing = 10
        stats.add_error("Test error message")
        data = stats.to_dict()
        self.assertEqual(data["source"], "test_source")
        self.assertEqual(data["new_models_found"], 5)
        self.assertEqual(data["matched_to_existing"], 10)
        self.assertEqual(len(data["errors"]), 1)

    @patch("urllib.request.urlopen")
    def test_http_get_success(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"status": "ok"}'
        mock_resp.headers = {}
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        data = fetch_json("https://example.com/test", use_cache=False)
        self.assertEqual(data, {"status": "ok"})


if __name__ == "__main__":
    unittest.main()
