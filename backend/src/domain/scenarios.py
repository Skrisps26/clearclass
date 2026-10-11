"""Deterministic, fictional air-data scenarios for explicit demo use only."""

from datetime import UTC, date, datetime, time, timedelta
from typing import Final
from zoneinfo import ZoneInfo

from .models import AirHour, AirSnapshot, Location


SCENARIOS: Final[tuple[str, ...]] = (
    "severe-day",
    "very-poor-day",
    "moderate-day",
    "good-day",
)

# These deliberately fictional values are shared by every location.  They are
# scenario inputs for a U.S.-AQI reference display, not measurements, forecasts,
# or a conversion to any local authority's index.
_SYNTHETIC_PROFILE: Final[dict[str, tuple[float, float, int]]] = {
    "severe-day": (250.0, 320.0, 350),
    "very-poor-day": (125.0, 180.0, 200),
    "moderate-day": (35.0, 55.0, 75),
    "good-day": (10.0, 20.0, 35),
}
_SOURCE: Final = "ClearClass synthetic fixture; fictional values, not measured or live forecast"
_DOMAIN: Final = "synthetic U.S.-AQI reference inputs"


def _two_local_days_as_utc_hours(local_date: date, timezone_name: str) -> list[datetime]:
    """Return every UTC hour whose instant falls in two selected local dates.

    Advancing instants in UTC, rather than advancing wall-clock hours, retains
    both repeated hours in a fall transition and omits nonexistent spring hours.
    """
    timezone = ZoneInfo(timezone_name)
    start_local = datetime.combine(local_date, time.min, tzinfo=timezone)
    end_local = datetime.combine(local_date + timedelta(days=2), time.min, tzinfo=timezone)
    instant = start_local.astimezone(UTC)
    end = end_local.astimezone(UTC)

    hours: list[datetime] = []
    while instant < end:
        hours.append(instant)
        instant += timedelta(hours=1)
    return hours


def scenario_snapshot(location: Location, name: str, local_date: date) -> AirSnapshot:
    """Build a location-labelled, deterministic synthetic two-day snapshot.

    The selected location supplies only the grid label and IANA local-day
    boundaries. Pollutants and U.S.-AQI reference inputs are intentionally
    identical for a scenario in every geography.
    """
    try:
        pm25, pm10, reference_aqi = _SYNTHETIC_PROFILE[name]
    except KeyError as error:
        raise ValueError(f"unknown synthetic scenario: {name}") from error

    instants = _two_local_days_as_utc_hours(local_date, location.timezone)
    return AirSnapshot(
        locationId=location.id,
        gridLatitude=location.latitude,
        gridLongitude=location.longitude,
        fetchedAt=instants[0],
        source=_SOURCE,
        domain=_DOMAIN,
        scenario=name,
        hourly=[
            AirHour(time=instant, pm25=pm25, pm10=pm10, referenceAqi=reference_aqi)
            for instant in instants
        ],
    )
