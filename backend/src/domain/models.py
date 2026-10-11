"""Shared place and forecast contracts; all timestamps are aware UTC instants."""

from datetime import datetime
from math import isfinite
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Location(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int = Field(gt=0)
    name: str = Field(min_length=1)
    admin1: str | None = None
    country: str = Field(min_length=1)
    countryCode: str = Field(min_length=2, max_length=2)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    timezone: str = Field(min_length=1)

    @field_validator("latitude", "longitude")
    @classmethod
    def finite_coordinate(cls, value: float) -> float:
        if not isfinite(value):
            raise ValueError("coordinates must be finite")
        return value

    @field_validator("timezone")
    @classmethod
    def known_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as error:
            raise ValueError("unknown IANA timezone") from error
        return value


class AirHour(BaseModel):
    model_config = ConfigDict(extra="forbid")

    time: datetime
    pm25: float | None = Field(default=None, ge=0)
    pm10: float | None = Field(default=None, ge=0)
    referenceAqi: int | None = Field(default=None, ge=0)

    @field_validator("time")
    @classmethod
    def aware_time(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("forecast instant must have a timezone")
        return value

    @field_validator("pm25", "pm10")
    @classmethod
    def finite_pm(cls, value: float | None) -> float | None:
        if value is not None and not isfinite(value):
            raise ValueError("pollutant concentration must be finite")
        return value


class AirSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locationId: int = Field(gt=0)
    gridLatitude: float = Field(ge=-90, le=90)
    gridLongitude: float = Field(ge=-180, le=180)
    fetchedAt: datetime
    source: str = Field(min_length=1)
    domain: str = Field(min_length=1)
    scenario: str | None = None
    hourly: list[AirHour] = Field(min_length=1)

    @field_validator("fetchedAt")
    @classmethod
    def aware_fetched_at(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("snapshot time must have a timezone")
        return value

    @field_validator("gridLatitude", "gridLongitude")
    @classmethod
    def finite_grid(cls, value: float) -> float:
        if not isfinite(value):
            raise ValueError("grid coordinate must be finite")
        return value

    @model_validator(mode="after")
    def ordered_hours(self) -> "AirSnapshot":
        times = [item.time.timestamp() for item in self.hourly]
        if any(current >= following for current, following in zip(times, times[1:])):
            raise ValueError("forecast instants must increase strictly")
        return self
