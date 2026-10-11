import copy
import sys
import unittest
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from domain import ventilation  # noqa: E402
from domain.models import AirHour, AirSnapshot, Location  # noqa: E402


def location(timezone: str = "Europe/London") -> Location:
    return Location(
        id=1001,
        name="Fixture place",
        admin1="Fixture region",
        country="Fixture country",
        countryCode="GB",
        latitude=51.5,
        longitude=-0.1,
        timezone=timezone,
    )


def snapshot_for(place: Location, local_day: date, pm25: float = 20.0) -> AirSnapshot:
    zone = ZoneInfo(place.timezone)
    instant = datetime.combine(local_day, time.min, tzinfo=zone).astimezone(UTC)
    end = datetime.combine(local_day + timedelta(days=1), time.min, tzinfo=zone).astimezone(UTC)
    hours = []
    while instant < end:
        hours.append(AirHour(time=instant, pm25=pm25, pm10=pm25 * 1.5, referenceAqi=50))
        instant += timedelta(hours=1)
    return AirSnapshot(
        locationId=place.id,
        gridLatitude=place.latitude,
        gridLongitude=place.longitude,
        fetchedAt=hours[0].time,
        source="test fixture",
        domain="test",
        hourly=hours,
    )


def estimation_ready_config() -> dict:
    """Test-only substitute for attributable room-specific ACH inputs."""
    config = copy.deepcopy(ventilation._CONFIG)
    config["pm25"]["closedAirChangesPerHour"]["availableForEstimation"] = True
    config["pm25"]["openAirChangesPerHour"]["availableForEstimation"] = True
    return config


class VentilationPhysicsTests(unittest.TestCase):
    def setUp(self):
        override = patch.object(ventilation, "_CONFIG", estimation_ready_config())
        override.start()
        self.addCleanup(override.stop)

    def test_pm25_analytic_steady_state_and_zero_removal_limit(self):
        steady_state = 1.0 * 0.8 * 100.0 / (1.0 + 0.39)
        long_run = ventilation.advance_pm25(0.0, 100.0, 1.0, 0.8, 0.39, 200.0)

        self.assertAlmostEqual(long_run, steady_state, places=10)
        self.assertEqual(ventilation.advance_pm25(12.0, 100.0, 0.0, 0.8, 0.0, 1.0), 12.0)

    def test_co2_zero_air_change_has_dimensionally_correct_linear_source(self):
        # 1,000 ppm/hour for 30 people at 0.1 L/min each in 180 m3:
        # 30 * 0.1 * 60,000 / 180 = 1,000 ppm/hour.
        generation = ventilation._co2_generation_ppm_per_hour(30, 0.1, 180.0)

        self.assertEqual(generation, 1000.0)
        self.assertEqual(ventilation.advance_co2(450.0, 426.0, generation, 0.0, 0.5), 950.0)

    def test_higher_occupancy_increases_modelled_co2_and_higher_outdoor_pm_increases_exposure(self):
        place = location()
        day = date(2026, 3, 16)
        clean_snapshot = snapshot_for(place, day, pm25=10.0)
        polluted_snapshot = snapshot_for(place, day, pm25=80.0)

        sparse = ventilation.estimate_ventilation(clean_snapshot, place, day, occupants=10)
        crowded = ventilation.estimate_ventilation(clean_snapshot, place, day, occupants=40)
        polluted = ventilation.estimate_ventilation(polluted_snapshot, place, day, occupants=10)

        self.assertEqual(sparse["status"], "estimated")
        self.assertGreater(crowded["summary"]["maxEstimatedIndoorCo2Ppm"], sparse["summary"]["maxEstimatedIndoorCo2Ppm"])
        self.assertGreater(
            polluted["summary"]["integratedIndoorPm25UgHourM3"],
            sparse["summary"]["integratedIndoorPm25UgHourM3"],
        )

    def test_disallowed_opening_returns_closed_rising_co2_warning(self):
        place = location()
        day = date(2026, 3, 16)
        config = copy.deepcopy(ventilation._CONFIG)
        config["openingPolicy"]["allowOpening"] = False

        with patch.object(ventilation, "_CONFIG", config):
            result = ventilation.estimate_ventilation(snapshot_for(place, day), place, day)

        self.assertEqual(result["schedule"]["name"], "closed")
        self.assertFalse(result["schedule"]["openingAllowed"])
        self.assertEqual(result["schedule"]["windowsOpenAt"], [])
        self.assertTrue(result["schedule"]["closedAndRisingCo2Warning"])

    def test_no_schedule_meeting_co2_indicator_is_explicitly_infeasible(self):
        place = location()
        day = date(2026, 3, 16)
        config = copy.deepcopy(ventilation._CONFIG)
        config["co2"]["concernPpm"]["value"] = 430.0

        with patch.object(ventilation, "_CONFIG", config):
            result = ventilation.estimate_ventilation(snapshot_for(place, day), place, day)

        self.assertFalse(result["schedule"]["co2Feasible"])
        self.assertEqual(result["status"], "estimated")

    def test_london_dst_dates_preserve_local_school_day_while_offsets_change(self):
        place = location("Europe/London")
        spring_day = date(2026, 3, 29)
        fall_day = date(2026, 10, 25)

        spring = ventilation.estimate_ventilation(snapshot_for(place, spring_day), place, spring_day)
        fall = ventilation.estimate_ventilation(snapshot_for(place, fall_day), place, fall_day)

        self.assertEqual(len(spring["steps"]), 78)
        self.assertEqual(len(fall["steps"]), 78)
        self.assertTrue(spring["schoolDay"]["start"].endswith("+01:00"))
        self.assertTrue(fall["schoolDay"]["start"].endswith("+00:00"))
        self.assertTrue(spring["steps"][0]["start"].startswith("2026-03-29T08:00:00"))
        self.assertTrue(fall["steps"][0]["start"].startswith("2026-10-25T08:00:00"))

    def test_non_hour_timezones_preserve_local_school_start(self):
        for timezone, offset in (("Asia/Kolkata", "+05:30"), ("Asia/Kathmandu", "+05:45")):
            with self.subTest(timezone=timezone):
                place = location(timezone)
                day = date(2026, 3, 16)
                result = ventilation.estimate_ventilation(snapshot_for(place, day), place, day)

                self.assertEqual(len(result["steps"]), 78)
                self.assertTrue(result["schoolDay"]["start"].endswith(offset))
                self.assertTrue(result["steps"][0]["start"].startswith("2026-03-16T08:00:00"))

    def test_missing_same_place_hourly_pm25_is_unavailable_not_substituted(self):
        place = location()
        day = date(2026, 3, 16)
        incomplete = snapshot_for(place, day)
        incomplete.hourly[8] = AirHour(time=incomplete.hourly[8].time, pm25=None, pm10=30.0, referenceAqi=50)

        result = ventilation.estimate_ventilation(incomplete, place, day)

        self.assertEqual(result["status"], "unavailable")
        self.assertIn("missing", result["reason"])


class VentilationConfigurationTests(unittest.TestCase):
    def test_unsourced_room_air_change_inputs_withhold_estimate(self):
        place = location()
        day = date(2026, 3, 16)
        result = ventilation.estimate_ventilation(snapshot_for(place, day), place, day)
        self.assertEqual(result["status"], "unavailable")
        self.assertNotIn("schedule", result)

    def test_fictional_reference_case_estimates_with_disclosed_external_airflow(self):
        place = location("Asia/Kolkata")
        day = date(2026, 3, 16)
        result = ventilation.estimate_ventilation(
            snapshot_for(place, day), place, day, reference_case=True
        )
        self.assertEqual(result["status"], "estimated")
        self.assertIn("fictional", result["inputs"]["airflowBasis"])
        self.assertIn("usablebuildings.co.uk", result["assumptions"]["pm25"]["openAirChangesPerHour"]["source"]["url"])

    def test_numeric_parameters_disclose_classification_units_and_sources_or_uncertainty(self):
        config = ventilation._CONFIG
        parameters = (
            config["pm25"]["closedAirChangesPerHour"],
            config["pm25"]["openAirChangesPerHour"],
            config["pm25"]["penetrationFactor"],
            config["pm25"]["depositionPerHour"],
            config["co2"]["generationLitresPerMinutePerPerson"],
            config["co2"]["outdoorPpm"],
            config["co2"]["goodVentilationIndicatorPpm"],
            config["co2"]["concernPpm"],
        )

        for parameter in parameters:
            with self.subTest(parameter=parameter):
                self.assertIn("unit", parameter)
                self.assertIn("classification", parameter)
                self.assertTrue("source" in parameter or "uncertainty" in parameter)


if __name__ == "__main__":
    unittest.main()
