from datetime import date
from decimal import Decimal
import unittest

from fortnight import ShiftPayload, break_reason, build_usage_summary, find_break, get_usage_status, get_visa_limit


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


    def test_break_hours_are_excluded_from_the_counted_total(self):
        start, end = date(2026, 10, 1), date(2026, 10, 14)
        breaks = [{"id": "b1", "label": "Mid-semester break", "startDate": "2026-10-05", "endDate": "2026-10-09"}]
        shifts = [
            {"date": "2026-10-02", "hours": 30},
            {"date": "2026-10-05", "hours": 10},
            {"date": "2026-10-09", "hours": 12},
            {"date": "2026-10-10", "hours": 8},
        ]
        summary = build_usage_summary(shifts, "Student visa (subclass 500)", start, end, breaks)
        self.assertEqual(summary["currentHours"], 38.0)
        self.assertEqual(summary["breakHours"], 22.0)
        self.assertEqual(summary["remainingHours"], 10.0)
        self.assertEqual(summary["status"], "tight")
        in_break = [day.date.isoformat() for day in summary["dailyHours"] if day.inBreak]
        self.assertEqual(in_break, ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"])

    def test_without_breaks_every_hour_counts(self):
        shifts = [{"date": "2026-10-05", "hours": 50}]
        summary = build_usage_summary(shifts, "Student visa (subclass 500)", date(2026, 10, 1), date(2026, 10, 14))
        self.assertEqual(summary["currentHours"], 50.0)
        self.assertEqual(summary["breakHours"], 0.0)
        self.assertEqual(summary["status"], "over")

    def test_find_break_is_inclusive_of_both_ends(self):
        breaks = [{"id": "b1", "label": None, "startDate": "2026-12-01", "endDate": "2026-12-03"}]
        self.assertIsNotNone(find_break(date(2026, 12, 1), breaks))
        self.assertIsNotNone(find_break(date(2026, 12, 3), breaks))
        self.assertIsNone(find_break(date(2026, 11, 30), breaks))
        self.assertIsNone(find_break(date(2026, 12, 4), breaks))

    def test_break_reason_explains_the_shift_is_not_counted(self):
        reason = break_reason({"label": "Summer break", "startDate": "2026-12-01", "endDate": "2027-02-28"}, 12.0)
        self.assertIn('"Summer break"', reason)
        self.assertIn("not counted toward the fortnightly cap", reason)
        self.assertIn("1 Dec 2026 to 28 Feb 2027", reason)

    def test_employer_hours_are_grouped_from_counted_shifts_only(self):
        breaks = [{"id": "b1", "label": None, "startDate": "2026-10-05", "endDate": "2026-10-05"}]
        shifts = [
            {"date": "2026-10-02", "hours": 6, "employer": "Cafe"},
            {"date": "2026-10-03", "hours": 10, "employer": "Warehouse"},
            {"date": "2026-10-04", "hours": 4, "employer": "Cafe"},
            {"date": "2026-10-05", "hours": 9, "employer": "Cafe"},
            {"date": "2026-10-06", "hours": 3, "employer": None},
        ]
        summary = build_usage_summary(shifts, "Student visa (subclass 500)", date(2026, 10, 1), date(2026, 10, 14), breaks)
        self.assertEqual([(row.employer, row.hours) for row in summary["employerHours"]], [("Cafe", 10.0), ("Warehouse", 10.0), (None, 3.0)])

    def test_employer_label_is_optional_trimmed_and_limited(self):
        base = {"date": "2026-10-01", "startTime": "09:00", "endTime": "12:00"}
        self.assertIsNone(ShiftPayload(**base).employer)
        self.assertIsNone(ShiftPayload(**base, employer="   ").employer)
        self.assertEqual(ShiftPayload(**base, employer="  Cafe  ").employer, "Cafe")
        with self.assertRaises(ValueError):
            ShiftPayload(**base, employer="x" * 61)


if __name__ == "__main__":
    unittest.main()