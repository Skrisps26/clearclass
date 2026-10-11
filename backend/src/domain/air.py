"""Open-Meteo geocoding and CAMS Global air-quality provider."""

from __future__ import annotations

from datetime import UTC, datetime
from math import isfinite
from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from .models import AirHour, AirSnapshot, Location


GEOCODING_SEARCH_URL = "https://geocoding-api.open-meteo.com/v1/search"
GEOCODING_GET_URL = "https://geocoding-api.open-meteo.com/v1/get"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
REQUEST_TIMEOUT = httpx.Timeout(5.0, connect=2.0)


class ProviderError(Exception):
    """A provider failure that callers can safely map to an API response."""

    _KINDS = frozenset({"unavailable", "not_found", "invalid"})

    def __init__(self, kind: str, message: str) -> None:
        if kind not in self._KINDS:
            raise ValueError(f"unsupported provider error kind: {kind}")
        self.kind = kind
        super().__init__(message)


class _GeocodingLocation(BaseModel):
    """The usable subset of an Open-Meteo geocoding response."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: int = Field(gt=0)
    name: str = Field(min_length=1)
    admin1: str | None = None
    country: str = Field(min_length=1)
    countryCode: str = Field(min_length=2, max_length=2, alias="country_code")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    timezone: str = Field(min_length=1)

    def location(self) -> Location:
        return Location.model_validate(self.model_dump())



class _ForecastResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    hourly_units: dict[str, str]
    hourly: dict[str, list[Any]]


class GeoProvider:
    """Fetch globally resolved locations and CAMS Global forecasts without caching."""

    def __init__(self, client: httpx.Client) -> None:
        self._client = client

    def search(self, query: str, lang: str) -> list[Location]:
        normalized_query = self._validate_query(query)
        self._validate_language(lang)
        payload = self._get_json(
            GEOCODING_SEARCH_URL,
            params={"name": normalized_query, "count": 5, "language": lang, "format": "json"},
        )
        if not isinstance(payload, dict) or not isinstance(payload.get("results", []), list):
            raise ProviderError("invalid", "geocoding search returned invalid results")
        locations = []
        for row in payload.get("results", []):
            try:
                locations.append(_GeocodingLocation.model_validate(row).location())
            except ValidationError:
                continue  # An unusable suggestion must not invalidate valid alternatives.
        return locations

    def get(self, location_id: int) -> Location:
        if isinstance(location_id, bool) or not isinstance(location_id, int) or location_id <= 0:
            raise ProviderError("invalid", "location id must be a positive integer")

        payload = self._get_json(GEOCODING_GET_URL, params={"id": location_id})
        try:
            response = _GeocodingLocation.model_validate(payload)
            if response.id != location_id:
                raise ValueError("response location id does not match request")
            return response.location()
        except (ValidationError, ValueError) as error:
            raise ProviderError("invalid", "geocoding lookup returned invalid location data") from error

    def forecast(self, location: Location) -> AirSnapshot:
        if not isinstance(location, Location):
            raise ProviderError("invalid", "forecast requires a validated location")

        payload = self._get_json(
            AIR_QUALITY_URL,
            params={
                "latitude": location.latitude,
                "longitude": location.longitude,
                "hourly": "pm2_5,pm10,us_aqi",
                "timezone": "UTC",
                "timeformat": "unixtime",
                "domains": "cams_global",
                "forecast_days": 2,
            },
        )
        try:
            response = _ForecastResponse.model_validate(payload)
            self._validate_forecast_units(response.hourly_units)
            hours = self._hours(response.hourly)
            return AirSnapshot(
                locationId=location.id,
                gridLatitude=response.latitude,
                gridLongitude=response.longitude,
                fetchedAt=datetime.now(UTC),
                source="Open-Meteo/CAMS Global forecast; U.S. AQI reference, not official local AQI",
                domain="cams_global",
                hourly=hours,
            )
        except (ValidationError, TypeError, ValueError, OverflowError, OSError) as error:
            raise ProviderError("invalid", "air-quality forecast returned invalid data") from error

    @staticmethod
    def _validate_query(query: str) -> str:
        if not isinstance(query, str):
            raise ProviderError("invalid", "location query must be text")
        normalized_query = query.strip()
        if len(normalized_query) < 3:
            raise ProviderError("invalid", "location query must contain at least three characters")
        return normalized_query

    @staticmethod
    def _validate_language(lang: str) -> None:
        if lang not in {"en", "hi"}:
            raise ProviderError("invalid", "language must be en or hi")

    def _get_json(self, url: str, *, params: dict[str, Any]) -> Any:
        try:
            response = self._client.get(url, params=params, timeout=REQUEST_TIMEOUT)
        except httpx.HTTPError as error:
            raise ProviderError("unavailable", "provider request failed") from error

        if response.status_code == 404:
            raise ProviderError("not_found", "provider resource was not found")
        if response.status_code == 429 or response.status_code >= 500:
            raise ProviderError("unavailable", "provider is unavailable")
        if not response.is_success:
            raise ProviderError("invalid", "provider rejected the request")

        try:
            return response.json()
        except ValueError as error:
            raise ProviderError("invalid", "provider returned malformed JSON") from error

    @staticmethod
    def _validate_forecast_units(units: dict[str, str]) -> None:
        expected = {
            "time": "unixtime",
            "pm2_5": "μg/m³",
            "pm10": "μg/m³",
            "us_aqi": "USAQI",
        }
        if any(units.get(key) != unit for key, unit in expected.items()):
            raise ValueError("forecast units do not match the requested variables")

    @staticmethod
    def _hours(hourly: dict[str, list[Any]]) -> list[AirHour]:
        required_keys = ("time", "pm2_5", "pm10", "us_aqi")
        if any(key not in hourly or not isinstance(hourly[key], list) for key in required_keys):
            raise ValueError("forecast hourly arrays are missing")

        times, pm25, pm10, reference_aqi = (hourly[key] for key in required_keys)
        if not times or len({len(times), len(pm25), len(pm10), len(reference_aqi)}) != 1:
            raise ValueError("forecast hourly arrays must be non-empty and equally sized")

        hours: list[AirHour] = []
        previous_epoch: float | None = None
        for epoch, fine_particles, coarse_particles, aqi in zip(times, pm25, pm10, reference_aqi, strict=True):
            epoch_number = GeoProvider._nonnegative_number(epoch, "forecast epoch")
            if previous_epoch is not None and epoch_number <= previous_epoch:
                raise ValueError("forecast epochs must increase strictly")
            previous_epoch = epoch_number
            hours.append(
                AirHour(
                    time=datetime.fromtimestamp(epoch_number, tz=UTC),
                    pm25=GeoProvider._nonnegative_number(fine_particles, "pm2.5"),
                    pm10=GeoProvider._nonnegative_number(coarse_particles, "pm10"),
                    referenceAqi=GeoProvider._reference_aqi(aqi),
                )
            )
        return hours

    @staticmethod
    def _nonnegative_number(value: Any, label: str) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value) or value < 0:
            raise ValueError(f"{label} must be a finite nonnegative number")
        return float(value)

    @staticmethod
    def _reference_aqi(value: Any) -> int:
        number = GeoProvider._nonnegative_number(value, "U.S. AQI")
        if not number.is_integer():
            raise ValueError("U.S. AQI must be an integer")
        return int(number)
