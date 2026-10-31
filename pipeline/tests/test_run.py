import unittest
from unittest.mock import Mock, patch

from pipeline import run


class TestPipelineRun(unittest.TestCase):

    @patch("pipeline.run.configure_logging")
    @patch("pipeline.run.normalize.main")
    @patch("pipeline.run.enrich_mod.main")
    def test_fetcher_failure_propagates_and_later_fetchers_run(
        self, mock_enrich, mock_normalize, mock_configure
    ):
        failed_fetcher = Mock(return_value=1)
        later_fetcher = Mock(return_value=0)

        fetchers = [
            ("failed_fetcher", failed_fetcher),
            ("later_fetcher", later_fetcher),
        ]

        with patch.object(run, "FETCHERS", fetchers):
            rc = run.main()

        self.assertEqual(rc, 1)
        failed_fetcher.assert_called_once()
        later_fetcher.assert_called_once()
        mock_normalize.assert_called_once()
        mock_enrich.assert_called_once()

    @patch("pipeline.run.configure_logging")
    @patch("pipeline.run.normalize.main")
    @patch("pipeline.run.enrich_mod.main")
    def test_system_exit_handling(
        self, mock_enrich, mock_normalize, mock_configure
    ):
        failed_fetcher = Mock(side_effect=SystemExit(2))
        later_fetcher = Mock(return_value=0)

        with patch.object(
            run,
            "FETCHERS",
            [("failed_fetcher", failed_fetcher), ("later_fetcher", later_fetcher)],
        ):
            rc = run.main()

        self.assertEqual(rc, 2)
        later_fetcher.assert_called_once()

    @patch("pipeline.run.configure_logging")
    @patch("pipeline.run.normalize.main")
    @patch("pipeline.run.enrich_mod.main")
    def test_exception_handling(
        self, mock_enrich, mock_normalize, mock_configure
    ):
        failed_fetcher = Mock(side_effect=RuntimeError("Test failure"))
        later_fetcher = Mock(return_value=0)

        with patch.object(
            run,
            "FETCHERS",
            [("failed_fetcher", failed_fetcher), ("later_fetcher", later_fetcher)],
        ):
            rc = run.main()

        self.assertEqual(rc, 1)
        later_fetcher.assert_called_once()


if __name__ == "__main__":
    unittest.main()
