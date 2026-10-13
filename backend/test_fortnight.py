from datetime import date
from decimal import Decimal
import unittest

from fortnight import build_usage_summary, get_usage_status, get_visa_limit


class FortnightRulesTests(unittest.TestCase):
    def test_student_500_has_a_48_hour_limit(self):
        self.assertEqual(get_visa_limit("Student visa (subclass 500)"), Decimal("48"))

    def test_uncapped_visa_types(self):
        for visa_type in ("Student visa (subclass 500) - aged care sector", "Student guardian visa (subclass 590)", "Other / not listed"):
            self.assertIsNone(get_visa_limit(visa_type))

    def test_unknown_saved_value_is_uncapped(self):
        self.assertIsNone(get_visa_limit("Other student visa"))
        self.assertEqual(build_usage_summary([{"date": "2026-10-02", "hours": 60}], "Something else", date(2026, 10, 1), date(2026, 10, 14))["status"], "safe")

    def test_status_thresholds(self):
        limit = Decimal("48")
        self.assertEqual(get_usage_status(Decimal("35.99"), limit), "safe")
        self.assertEqual(get_usage_status(Decimal("36"), limit), "tight")
        self.assertEqual(get_usage_status(Decimal("48"), limit), "tight")
        self.assertEqual(get_usage_status(Decimal("48.01"), limit), "over")

    def test_summary_returns_all_14_days_and_remaining_hours(self):
        start = date(2026, 10, 1)
        end = date(2026, 10, 14)
        summary = build_usage_summary([{"date": "2026-10-02", "hours": 8}], "Student visa (subclass 500)", start, end)
        self.assertEqual(summary["currentHours"], 8.0)
        self.assertEqual(summary["remainingHours"], 40.0)
        self.assertEqual(len(summary["dailyHours"]), 14)


if __name__ == "__main__":
    unittest.main()