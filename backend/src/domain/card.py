"""Frontend-facing deterministic daily-card contract.

The models in this module are deliberately transport-only.  Domain evaluators keep
producing their own evidence; the brief handler adapts that evidence into this
validated, versioned response before it is cached or sent to the client.
"""

from __future__ import annotations

from datetime import date, datetime
from math import isfinite
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Coordinates(_StrictModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    @field_validator("latitude", "longitude")
    @classmethod
    def finite_coordinate(cls, value: float) -> float:
        if not isfinite(value):
            raise ValueError("coordinates must be finite")
        return value


class CardLocation(_StrictModel):
    """Resolved provider place, never a client assertion."""

    id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=200)
    coordinates: Coordinates
    country: str = Field(min_length=1, max_length=120)
    timezone: str = Field(min_length=1, max_length=100)
    admin1: str | None = Field(default=None, max_length=120)
    countryCode: str | None = Field(default=None, min_length=2, max_length=2)

    @field_validator("timezone")
    @classmethod
    def known_iana_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as error:
            raise ValueError("timezone must be a known IANA timezone") from error
        return value


class ReferenceAqi(_StrictModel):
    scheme: str = Field(min_length=1, max_length=80)
    value: int = Field(ge=0)
    provider: str = Field(min_length=1, max_length=200)
    modelled: bool


class AuthoritativeLocalAqi(_StrictModel):
    """An authority-issued AQI, intentionally separate from reference AQI."""

    scheme: str = Field(min_length=1, max_length=80)
    value: int = Field(ge=0)
    provider: str = Field(min_length=1, max_length=200)
    issuedAt: datetime | None = None
    sourceUrl: HttpUrl | None = None

    @field_validator("issuedAt")
    @classmethod
    def aware_issued_at(cls, value: datetime | None) -> datetime | None:
        return _aware(value, "authoritative AQI issue time")


class AirHour(_StrictModel):
    """One provider forecast instant; ``time`` is always an aware instant."""

    time: datetime
    localTime: datetime | None = None
    pm25: float | None = Field(default=None, ge=0)
    pm10: float | None = Field(default=None, ge=0)
    referenceAqi: int | None = Field(default=None, ge=0)

    @field_validator("time", "localTime")
    @classmethod
    def aware_hour(cls, value: datetime | None) -> datetime | None:
        return _aware(value, "air forecast time")

    @field_validator("pm25", "pm10")
    @classmethod
    def finite_pollutant(cls, value: float | None) -> float | None:
        if value is not None and not isfinite(value):
            raise ValueError("pollutant concentrations must be finite")
        return value


class AirData(_StrictModel):
    status: Literal["synthetic", "cached", "cached_stale", "modelled", "unavailable"]
    referenceAqi: ReferenceAqi | None = None
    authoritativeLocalAqi: AuthoritativeLocalAqi | None = None
    grid: Coordinates | None = None
    domain: str | None = Field(default=None, min_length=1, max_length=100)
    sourceResolution: str | None = Field(default=None, min_length=1, max_length=300)
    ageMinutes: int | None = Field(default=None, ge=0)
    stale: bool
    hourly: list[AirHour] = Field(default_factory=list, max_length=72)
    message: str | None = Field(default=None, min_length=1, max_length=500)

    @model_validator(mode="after")
    def unavailable_has_no_forecast(self) -> "AirData":
        if self.status == "unavailable" and self.hourly:
            raise ValueError("unavailable air data cannot include forecast hours")
        return self


class EvidenceSource(_StrictModel):
    id: str = Field(min_length=1, max_length=160)
    publisher: str | None = Field(default=None, min_length=1, max_length=240)
    title: str = Field(min_length=1, max_length=300)
    url: HttpUrl
    issued: str | None = Field(default=None, max_length=80)
    accessed: str | None = Field(default=None, max_length=80)
    pages: str | None = Field(default=None, max_length=80)
    classification: str = Field(min_length=1, max_length=100)
    notes: str | None = Field(default=None, max_length=1_000)


class OfficialStage(_StrictModel):
    """A verified official stage, never defaulted to a clean/zero stage."""

    stage: str | None = Field(default=None, min_length=1, max_length=160)
    source: EvidenceSource | None = None
    issueTime: datetime | None = None
    effectiveFrom: datetime | None = None
    effectiveUntil: datetime | None = None

    @field_validator("issueTime", "effectiveFrom", "effectiveUntil")
    @classmethod
    def aware_stage_times(cls, value: datetime | None) -> datetime | None:
        return _aware(value, "official stage time")


class Verdict(_StrictModel):
    activity: str = Field(min_length=1, max_length=100)
    cohort: str = Field(min_length=1, max_length=100)
    decision: Literal["allow", "modify", "deny"]
    status: Literal["evaluated", "insufficient_data", "stale", "unavailable"]
    selectedAction: str | None = Field(default=None, min_length=1, max_length=200)
    ruleIds: list[str] = Field(default_factory=list, max_length=32)
    sources: list[EvidenceSource] = Field(default_factory=list, max_length=32)
    referenceAqiInput: ReferenceAqi | None = None
    forecastValidTimes: list[datetime] = Field(default_factory=list, max_length=72)
    inputDescription: str | None = Field(default=None, min_length=1, max_length=1_000)
    basis: str | None = Field(default=None, min_length=1, max_length=120)
    policySetVersion: str | None = Field(default=None, min_length=1, max_length=500)
    modifications: list[str] = Field(default_factory=list, max_length=16)
    assumptions: list[str] = Field(default_factory=list, max_length=32)
    sensitivePupilCaveat: str | None = Field(default=None, min_length=1, max_length=1_000)
    indoorAirCaveat: str | None = Field(default=None, min_length=1, max_length=1_000)
    sourceTime: datetime | None = None
    reason: str | None = Field(default=None, min_length=1, max_length=1_000)

    @field_validator("sourceTime")
    @classmethod
    def aware_source_time(cls, value: datetime | None) -> datetime | None:
        return _aware(value, "verdict source time")

    @field_validator("forecastValidTimes")
    @classmethod
    def aware_forecast_times(cls, values: list[datetime]) -> list[datetime]:
        for value in values:
            _aware(value, "verdict forecast valid time")
        return values


class VentilationStep(_StrictModel):
    """One five-minute model step, expressly an estimate rather than a measurement."""

    start: datetime
    outdoorPm25UgM3: float = Field(ge=0)
    windowsOpen: bool
    airChangesPerHour: float = Field(ge=0)
    estimatedIndoorPm25UgM3: float = Field(ge=0)
    estimatedIndoorCo2Ppm: float = Field(ge=0)

    @field_validator("start")
    @classmethod
    def aware_step_time(cls, value: datetime) -> datetime:
        result = _aware(value, "ventilation step time")
        if result is None:
            raise ValueError("ventilation step time is required")
        return result

    @field_validator(
        "outdoorPm25UgM3",
        "airChangesPerHour",
        "estimatedIndoorPm25UgM3",
        "estimatedIndoorCo2Ppm",
    )
    @classmethod
    def finite_step_number(cls, value: float) -> float:
        if not isfinite(value):
            raise ValueError("ventilation step values must be finite")
        return value


class ModelAssumption(_StrictModel):
    id: str = Field(min_length=1, max_length=160)
    label: str = Field(min_length=1, max_length=300)
    value: str | float | int | bool | None = None
    units: str | None = Field(default=None, min_length=1, max_length=80)
    source: EvidenceSource | None = None
    uncertainty: str | None = Field(default=None, min_length=1, max_length=500)

    @field_validator("value")
    @classmethod
    def finite_assumption_number(cls, value: str | float | int | bool | None):
        if isinstance(value, float) and not isfinite(value):
            raise ValueError("assumption numbers must be finite")
        return value


class FlushWindow(_StrictModel):
    start: datetime
    end: datetime

    @field_validator("start", "end")
    @classmethod
    def aware_window_time(cls, value: datetime) -> datetime:
        result = _aware(value, "flush window time")
        if result is None:
            raise ValueError("flush window time is required")
        return result

    @model_validator(mode="after")
    def ordered_window(self) -> "FlushWindow":
        if self.end <= self.start:
            raise ValueError("flush window must end after it starts")
        return self


class Ventilation(_StrictModel):
    status: Literal["estimated", "unavailable"]
    estimateLabel: str = Field(min_length=1, max_length=300)
    reason: str | None = Field(default=None, min_length=1, max_length=1_000)
    modelVersion: str | None = Field(default=None, min_length=1, max_length=120)
    assumptions: dict[str, object] | list[ModelAssumption] = Field(default_factory=dict)
    sources: list[EvidenceSource] = Field(default_factory=list, max_length=32)
    locationId: int | None = Field(default=None, gt=0)
    localDate: date | None = None
    timezone: str | None = Field(default=None, min_length=1, max_length=100)
    schoolDay: FlushWindow | None = None
    inputs: dict[str, object] = Field(default_factory=dict)
    schedule: dict[str, object] = Field(default_factory=dict)
    summary: dict[str, object] = Field(default_factory=dict)
    steps: list[VentilationStep] = Field(default_factory=list, max_length=78)
    flushWindows: list[FlushWindow] = Field(default_factory=list, max_length=24)
    co2Feasible: bool | None = None
    warnings: list[str] = Field(default_factory=list, max_length=16)

    @field_validator("timezone")
    @classmethod
    def known_ventilation_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as error:
            raise ValueError("ventilation timezone must be a known IANA timezone") from error
        return value


class ParentMessage(_StrictModel):
    en: str = Field(min_length=1, max_length=4_000)
    hi: str = Field(min_length=1, max_length=4_000)


class DailyCard(_StrictModel):
    """The complete versioned response for ``GET /schools/{id}/brief``."""

    schoolId: str = Field(min_length=1, max_length=160)
    date: date
    generatedAt: datetime
    dataSource: str = Field(min_length=1, max_length=200)
    dataAsOf: datetime | None = None
    location: CardLocation
    scenarioId: str | None = Field(default=None, min_length=1, max_length=120)
    policySetVersion: str | None = Field(default=None, min_length=1, max_length=500)
    regulatoryCoverage: Literal["reference_only", "verified_local", "local_status_unknown"]
    officialStage: OfficialStage | None = None
    officialStageStatus: Literal["current", "unknown", "stale", "unavailable"]
    air: AirData
    policySources: list[EvidenceSource] = Field(default_factory=list, max_length=32)
    verdicts: list[Verdict] = Field(default_factory=list, max_length=64)
    ventilation: Ventilation
    parentMessage: ParentMessage

    @field_validator("generatedAt", "dataAsOf")
    @classmethod
    def aware_card_times(cls, value: datetime | None) -> datetime | None:
        return _aware(value, "card timestamp")

    @model_validator(mode="after")
    def official_stage_is_qualified(self) -> "DailyCard":
        if self.officialStageStatus == "unknown" and self.officialStage is not None:
            raise ValueError("unknown official stage status cannot contain a stage")
        if self.regulatoryCoverage != "verified_local" and self.officialStage is not None:
            raise ValueError("only verified local coverage can include an official stage")
        return self


def _aware(value: datetime | None, label: str) -> datetime | None:
    if value is not None and (value.tzinfo is None or value.utcoffset() is None):
        raise ValueError(f"{label} must be timezone-aware")
    return value
