import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.advice import school_verdicts
from domain.models import AirHour, Location
from domain.scenarios import scenario_snapshot


class SchoolVerdictTests(unittest.TestCase):
    def place(self, timezone):
        return Location(id=9001, name="Fixture place", country="Fixture land", countryCode="GB", latitude=51.5, longitude=-0.1, timezone=timezone)

    def test_all_cohorts_get_reference_rules_without_local_law(self):
        place = self.place("Asia/Kathmandu")
        day = date(2026, 10, 10)
        verdicts, school_air = school_verdicts(scenario_snapshot(place, "very-poor-day", day), place, day, "synthetic")
        self.assertEqual(school_air["value"], 200)
        self.assertEqual(len(verdicts), 8)
        sport = next(item for item in verdicts if item["activity"] == "sports" and item["cohort"] == "all_students")
        self.assertEqual((sport["status"], sport["decision"]), ("evaluated", "modify"))
        self.assertTrue(sport["matchedPolicyIds"])
        self.assertTrue(sport["sources"])
        self.assertEqual(sport["basis"], "reference_advisory")
        self.assertTrue(all(item["forecastValidTimes"] for item in verdicts))

    def test_stale_or_missing_hour_withholds_recommendation(self):
        place = self.place("Europe/London")
        day = date(2026, 10, 25)
        forecast = scenario_snapshot(place, "good-day", day)
        stale, _ = school_verdicts(forecast, place, day, "cached_stale")
        self.assertTrue(all(item["status"] == "stale" for item in stale))
        forecast.hourly[9] = AirHour(time=forecast.hourly[9].time, pm25=10, pm10=20, referenceAqi=None)
        missing, air = school_verdicts(forecast, place, day, "synthetic")
        self.assertIsNone(air["value"])
        self.assertTrue(all(item["status"] == "insufficient_data" for item in missing))

    def test_out_of_school_guide_scenario_is_not_a_fabricated_ban(self):
        place = self.place("Asia/Kolkata")
        day = date(2026, 10, 10)
        verdicts, air = school_verdicts(scenario_snapshot(place, "severe-day", day), place, day, "synthetic")
        self.assertEqual(air["value"], 350)
        self.assertTrue(all(item["status"] == "unavailable" and not item["matchedPolicyIds"] for item in verdicts))


    def test_missing_initial_remote_pack_never_falls_back_to_local_permission(self):
        place = self.place("Europe/London")
        day = date(2026, 10, 10)
        verdicts, _ = school_verdicts(
            scenario_snapshot(place, "good-day", day), place, day,
            "synthetic", require_remote_policy=True,
        )
        self.assertTrue(all(item["status"] == "unavailable" for item in verdicts))
        self.assertTrue(all(not item["matchedPolicyIds"] for item in verdicts))

if __name__ == "__main__":
    unittest.main()
