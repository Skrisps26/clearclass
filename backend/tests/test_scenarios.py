import sys
import unittest
from datetime import UTC, date, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.models import Location
from domain.scenarios import SCENARIOS, scenario_snapshot


DELHI = Location(
    id=1,
    name="Delhi",
    admin1="Delhi",
    country="India",
    countryCode="IN",
    latitude=28.6139,
    longitude=77.209,
    timezone="Asia/Kolkata",
)
LONDON = Location(
    id=2,
    name="London",
    admin1="England",
    country="United Kingdom",
    countryCode="GB",
    latitude=51.5072,
    longitude=-0.1276,
    timezone="Europe/London",
)
KATHMANDU = Location(
    id=3,
    name="Kathmandu",
    admin1="Bagmati",
    country="Nepal",
    countryCode="NP",
    latitude=27.7172,
    longitude=85.324,
    timezone="Asia/Kathmandu",
)


class ScenarioSnapshotTests(unittest.TestCase):
    def test_all_named_scenarios_are_deterministic(self):
        self.assertEqual(
            SCENARIOS,
            ("severe-day", "very-poor-day", "moderate-day", "good-day"),
        )

        for name in SCENARIOS:
            with self.subTest(name=name):
                first = scenario_snapshot(DELHI, name, date(2026, 2, 1))
                second = scenario_snapshot(DELHI, name, date(2026, 2, 1))

                self.assertEqual(first, second)
                self.assertEqual(first.scenario, name)
                self.assertEqual(len(first.hourly), 48)

    def test_reference_inputs_are_identical_across_geographies(self):
        delhi = scenario_snapshot(DELHI, "very-poor-day", date(2026, 2, 1))
        london = scenario_snapshot(LONDON, "very-poor-day", date(2026, 2, 1))

        self.assertEqual(
            [(hour.pm25, hour.pm10, hour.referenceAqi) for hour in delhi.hourly],
            [(hour.pm25, hour.pm10, hour.referenceAqi) for hour in london.hourly],
        )
        self.assertNotEqual(delhi.hourly[0].time, london.hourly[0].time)

    def test_london_spring_transition_omits_nonexistent_local_hour(self):
        snapshot = scenario_snapshot(LONDON, "moderate-day", date(2026, 3, 29))
        local_hours = [hour.time.astimezone(ZoneInfo("Europe/London")) for hour in snapshot.hourly]
        spring_day_hours = [instant.hour for instant in local_hours if instant.date() == date(2026, 3, 29)]

        self.assertEqual(len(snapshot.hourly), 47)
        self.assertEqual(spring_day_hours, [0, *range(2, 24)])
        self._assert_utc_hours_are_strictly_monotonic(snapshot)

    def test_london_fall_transition_retains_both_repeated_local_hours(self):
        snapshot = scenario_snapshot(LONDON, "good-day", date(2026, 10, 25))
        local_hours = [hour.time.astimezone(ZoneInfo("Europe/London")) for hour in snapshot.hourly]
        repeated_hour = [
            instant
            for instant in local_hours
            if instant.date() == date(2026, 10, 25) and instant.hour == 1
        ]

        self.assertEqual(len(snapshot.hourly), 49)
        self.assertEqual(len(repeated_hour), 2)
        self.assertEqual(
            {instant.utcoffset() for instant in repeated_hour},
            {timedelta(hours=1), timedelta(0)},
        )
        self._assert_utc_hours_are_strictly_monotonic(snapshot)

    def test_non_hour_timezone_offset_keeps_local_midnight_boundaries(self):
        snapshot = scenario_snapshot(KATHMANDU, "good-day", date(2026, 2, 1))
        first_local = snapshot.hourly[0].time.astimezone(ZoneInfo("Asia/Kathmandu"))

        self.assertEqual(len(snapshot.hourly), 48)
        self.assertEqual((first_local.hour, first_local.minute), (0, 0))
        self.assertEqual(first_local.utcoffset(), timedelta(hours=5, minutes=45))
        self.assertEqual((snapshot.hourly[0].time.hour, snapshot.hourly[0].time.minute), (18, 15))
        self._assert_utc_hours_are_strictly_monotonic(snapshot)

    def test_snapshot_explicitly_labels_fictional_non_live_provenance(self):
        snapshot = scenario_snapshot(DELHI, "severe-day", date(2026, 2, 1))

        self.assertEqual(snapshot.domain, "synthetic U.S.-AQI reference inputs")
        self.assertIn("synthetic", snapshot.source.lower())
        self.assertIn("fictional", snapshot.source.lower())
        self.assertIn("not measured", snapshot.source.lower())
        self.assertIn("not measured or live forecast", snapshot.source.lower())
        self.assertEqual(snapshot.scenario, "severe-day")

    def test_unknown_scenario_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown synthetic scenario"):
            scenario_snapshot(DELHI, "unrecognised-day", date(2026, 2, 1))

    def _assert_utc_hours_are_strictly_monotonic(self, snapshot):
        instants = [hour.time.astimezone(UTC) for hour in snapshot.hourly]
        self.assertTrue(all(current < following for current, following in zip(instants, instants[1:])))
        self.assertTrue(
            all(following - current == timedelta(hours=1) for current, following in zip(instants, instants[1:]))
        )


if __name__ == "__main__":
    unittest.main()
