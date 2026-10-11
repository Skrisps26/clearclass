"""Bounded, source-disclosed single-zone ventilation estimates.

This module is deliberately a forecast model rather than a sensor or compliance
system.  It consumes the selected location's hourly PM2.5 forecast, makes every
parameter visible from ``config/ventilation.json``, and never turns a modelled
CO2 result into a health, legal, or building-safety claim.
"""

from __future__ import annotations

from bisect import bisect_right
import copy
import json
import math
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from .models import AirSnapshot, Location

_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "ventilation.json"
with _CONFIG_PATH.open(encoding="utf-8") as _config_file:
    _CONFIG: dict[str, Any] = json.load(_config_file)

_EPSILON = 1e-12


@dataclass(frozen=True)
class _Candidate:
    """One deliberately small, deterministic opening schedule."""

    name: str
    phase_minutes: int | None


def advance_pm25(
    concentration: float,
    outdoor_concentration: float,
    air_changes_per_hour: float,
    penetration_factor: float,
    deposition_per_hour: float,
    duration_hours: float,
) -> float:
    """Return the analytic PM2.5 mass-balance update for a constant step.

    The equation is ``dC/dt = λ P Cout - (λ + k) C``.  The zero-removal branch
    is retained explicitly so a zero-ACH/zero-deposition configuration does not
    divide by zero or add a spurious change.
    """
    removal = air_changes_per_hour + deposition_per_hour
    source = air_changes_per_hour * penetration_factor * outdoor_concentration
    if abs(removal) <= _EPSILON:
        return concentration + source * duration_hours
    equilibrium = source / removal
    decay = math.exp(-removal * duration_hours)
    return equilibrium + (concentration - equilibrium) * decay


def advance_co2(
    concentration_ppm: float,
    outdoor_ppm: float,
    generation_ppm_per_hour: float,
    air_changes_per_hour: float,
    duration_hours: float,
) -> float:
    """Return the analytic CO2 update for constant occupancy and airflow."""
    if abs(air_changes_per_hour) <= _EPSILON:
        return concentration_ppm + generation_ppm_per_hour * duration_hours
    equilibrium = outdoor_ppm + generation_ppm_per_hour / air_changes_per_hour
    decay = math.exp(-air_changes_per_hour * duration_hours)
    return equilibrium + (concentration_ppm - equilibrium) * decay


def _unavailable(reason: str) -> dict[str, Any]:
    return {
        "status": "unavailable",
        "reason": reason,
        "estimateLabel": "Ventilation estimate unavailable; not measured.",
        "modelVersion": _CONFIG.get("modelVersion", "unknown"),
    }


def _number(value: Any, label: str, *, positive: bool = False) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    result = float(value)
    if (positive and result <= 0) or (not positive and result < 0):
        return None
    return result

def _airflow_parameters_available(reference_case: bool) -> bool:
    """Use room-verified airflow or an explicitly requested case-study demo."""
    pm25 = _CONFIG["pm25"]
    closed = pm25["closedAirChangesPerHour"]
    opened = pm25["openAirChangesPerHour"]
    if reference_case:
        return all(
            item.get("classification") == "published_case_study_reference"
            and isinstance(item.get("source"), dict)
            for item in (closed, opened)
        )
    return bool(closed.get("availableForEstimation") and opened.get("availableForEstimation"))


def _local_day_bounds(local_date: date, timezone: ZoneInfo) -> tuple[datetime, datetime]:
    school_day = _CONFIG["schoolDay"]
    start = time.fromisoformat(school_day["startLocal"])
    end = time.fromisoformat(school_day["endLocal"])
    return (
        datetime.combine(local_date, start, tzinfo=timezone),
        datetime.combine(local_date, end, tzinfo=timezone),
    )


def _hourly_pm25_for_day(
    snapshot: AirSnapshot,
    start: datetime,
    end: datetime,
) -> tuple[dict[datetime, float] | None, str | None]:
    """Resolve each step against its preceding hourly UTC sample.

    A local-time synthetic fixture can land at :15/:30/:45 UTC, while a live
    UTC forecast commonly lands at :00. Neither is relabelled or shifted.
    """
    samples = [
        (hour.time.astimezone(UTC), float(hour.pm25))
        for hour in snapshot.hourly
        if hour.pm25 is not None
    ]
    instants = [instant for instant, _ in samples]
    values: dict[datetime, float] = {}
    step = start.astimezone(UTC)
    end_utc = end.astimezone(UTC)
    while step < end_utc:
        index = bisect_right(instants, step) - 1
        if index < 0 or step - instants[index] >= timedelta(hours=1):
            return None, f"hourly PM2.5 is missing for {step.isoformat()}"
        values[step] = samples[index][1]
        step += timedelta(minutes=int(_CONFIG["schoolDay"]["stepMinutes"]))
    return values, None


def _candidate_schedules(opening_policy: dict[str, Any]) -> list[_Candidate]:
    candidates = [_Candidate("closed", None)]
    if not opening_policy["allowOpening"]:
        return candidates
    candidates.extend(
        _Candidate(f"hourly-flush-phase-{phase}", int(phase))
        for phase in opening_policy["candidatePhasesMinutes"]
    )
    return candidates


def _is_open(candidate: _Candidate, elapsed_minutes: int, opening_policy: dict[str, Any]) -> bool:
    if candidate.phase_minutes is None:
        return False
    interval = int(opening_policy["flushIntervalMinutes"])
    duration = int(opening_policy["flushDurationMinutes"])
    return (elapsed_minutes - candidate.phase_minutes) % interval < duration


def _co2_generation_ppm_per_hour(occupants: int, litres_per_minute_per_person: float, room_volume_m3: float) -> float:
    """Convert L/min/person to ppm/hour for the configured single-zone volume."""
    return occupants * litres_per_minute_per_person * 60_000.0 / room_volume_m3


def _simulate(
    candidate: _Candidate,
    hourly_pm25: dict[datetime, float],
    start: datetime,
    end: datetime,
    occupants: int,
    room_volume_m3: float,
    initial_pm25: float,
    initial_co2_ppm: float,
) -> dict[str, Any]:
    config = _CONFIG
    pm_config = config["pm25"]
    co2_config = config["co2"]
    opening_policy = config["openingPolicy"]
    step_minutes = int(config["schoolDay"]["stepMinutes"])
    duration_hours = step_minutes / 60.0
    generation = _co2_generation_ppm_per_hour(
        occupants,
        float(co2_config["generationLitresPerMinutePerPerson"]["value"]),
        room_volume_m3,
    )

    pm25 = initial_pm25
    co2 = initial_co2_ppm
    instant = start.astimezone(UTC)
    end_utc = end.astimezone(UTC)
    elapsed_minutes = 0
    steps: list[dict[str, Any]] = []
    integrated_pm25 = 0.0

    while instant < end_utc:
        outside_pm25 = hourly_pm25[instant]
        is_open = _is_open(candidate, elapsed_minutes, opening_policy)
        ach = float(
            (pm_config["openAirChangesPerHour"] if is_open else pm_config["closedAirChangesPerHour"])["value"]
        )
        pm25 = advance_pm25(
            pm25,
            outside_pm25,
            ach,
            float(pm_config["penetrationFactor"]["value"]),
            float(pm_config["depositionPerHour"]["value"]),
            duration_hours,
        )
        co2 = advance_co2(
            co2,
            float(co2_config["outdoorPpm"]["value"]),
            generation,
            ach,
            duration_hours,
        )
        local_instant = instant.astimezone(start.tzinfo)
        steps.append(
            {
                "start": local_instant.isoformat(),
                "outdoorPm25UgM3": outside_pm25,
                "windowsOpen": is_open,
                "airChangesPerHour": ach,
                "estimatedIndoorPm25UgM3": pm25,
                "estimatedIndoorCo2Ppm": co2,
            }
        )
        integrated_pm25 += pm25 * duration_hours
        instant += timedelta(minutes=step_minutes)
        elapsed_minutes += step_minutes

    concern = float(co2_config["concernPpm"]["value"])
    good = float(co2_config["goodVentilationIndicatorPpm"]["value"])
    return {
        "candidate": candidate,
        "steps": steps,
        "integratedPm25UgHourM3": integrated_pm25,
        "maxCo2Ppm": max(item["estimatedIndoorCo2Ppm"] for item in steps),
        "maxPm25UgM3": max(item["estimatedIndoorPm25UgM3"] for item in steps),
        "co2Feasible": all(item["estimatedIndoorCo2Ppm"] <= concern for item in steps),
        "co2GoodIndicatorMet": all(item["estimatedIndoorCo2Ppm"] < good for item in steps),
        "openStepCount": sum(item["windowsOpen"] for item in steps),
    }


def _choose_schedule(results: list[dict[str, Any]], opening_allowed: bool) -> tuple[dict[str, Any], str]:
    feasible = [result for result in results if result["co2Feasible"]]
    if feasible:
        selected = min(
            feasible,
            key=lambda result: (
                result["integratedPm25UgHourM3"],
                result["openStepCount"],
                result["candidate"].name,
            ),
        )
        return selected, "CO2-feasible candidate with the lowest integrated modelled PM2.5 exposure."

    if not opening_allowed:
        return results[0], "Opening is disallowed by the configured project policy; closed schedule retained despite CO2 infeasibility."

    selected = min(
        results,
        key=lambda result: (
            result["maxCo2Ppm"],
            result["integratedPm25UgHourM3"],
            result["candidate"].name,
        ),
    )
    return selected, "No bounded candidate met the CO2 reference indicator; selected the lowest maximum modelled CO2 candidate."


def estimate_ventilation(
    snapshot: AirSnapshot,
    location: Location,
    local_date: date,
    *,
    occupants: int = 30,
    room_volume_m3: float = 180.0,
    initial_pm25: float | None = None,
    initial_co2_ppm: float | None = None,
    reference_case: bool = False,
) -> dict[str, Any]:
    """Estimate one local school-day schedule from same-place hourly PM2.5.

    The function is deterministic and bounded to seven schedules: the closed
    schedule plus six source-disclosed hourly flush phases.  It returns an
    unavailable result, rather than filling gaps from another place or date,
    whenever a required selected-place PM2.5 hour or an essential input is absent.
    """
    if snapshot.locationId != location.id:
        return _unavailable("snapshot location does not match the selected location")
    if not isinstance(local_date, date) or isinstance(local_date, datetime):
        return _unavailable("local_date must be a calendar date")
    if isinstance(occupants, bool) or not isinstance(occupants, int) or occupants <= 0:
        return _unavailable("occupants must be a positive integer")
    volume = _number(room_volume_m3, "room_volume_m3", positive=True)
    if volume is None:
        return _unavailable("room_volume_m3 must be a finite positive value")
    if not _airflow_parameters_available(reference_case):
        return _unavailable(
            "room-specific assessed airflow is required; only fictional demonstrations may request the published UK reference case"
        )


    pm_initial = _number(initial_pm25, "initial_pm25") if initial_pm25 is not None else None
    co2_initial = _number(initial_co2_ppm, "initial_co2_ppm") if initial_co2_ppm is not None else None
    if initial_pm25 is not None and pm_initial is None:
        return _unavailable("initial_pm25 must be a finite non-negative value")
    if initial_co2_ppm is not None and co2_initial is None:
        return _unavailable("initial_co2_ppm must be a finite non-negative value")

    timezone = ZoneInfo(location.timezone)
    start, end = _local_day_bounds(local_date, timezone)
    hourly_pm25, failure = _hourly_pm25_for_day(snapshot, start, end)
    if failure is not None or hourly_pm25 is None:
        return _unavailable(failure or "hourly PM2.5 is unavailable")

    first_outdoor = hourly_pm25[start.astimezone(UTC)]
    if pm_initial is None:
        pm_initial = first_outdoor
    if co2_initial is None:
        co2_initial = float(_CONFIG["defaults"]["initialCo2"]["value"])

    opening_policy = _CONFIG["openingPolicy"]
    results = [
        _simulate(
            candidate,
            hourly_pm25,
            start,
            end,
            occupants,
            volume,
            pm_initial,
            co2_initial,
        )
        for candidate in _candidate_schedules(opening_policy)
    ]
    selected, selection_reason = _choose_schedule(results, bool(opening_policy["allowOpening"]))
    selected_candidate: _Candidate = selected["candidate"]
    open_windows = [step["start"] for step in selected["steps"] if step["windowsOpen"]]
    closed_and_rising = (
        not opening_policy["allowOpening"]
        and selected["steps"][-1]["estimatedIndoorCo2Ppm"] > co2_initial
    )

    return {
        "status": "estimated",
        "estimateLabel": "Estimated from a model, not measured.",
        "modelVersion": _CONFIG["modelVersion"],
        "locationId": location.id,
        "localDate": local_date.isoformat(),
        "timezone": location.timezone,
        "schoolDay": {"start": start.isoformat(), "end": end.isoformat()},
        "inputs": {
            "occupants": occupants,
            "roomVolumeM3": volume,
            "initialPm25UgM3": pm_initial,
            "initialCo2Ppm": co2_initial,
            "occupancySchedule": "constant occupancy for the configured school day",
            "snapshotSource": snapshot.source,
            "snapshotScenario": snapshot.scenario,
            "airflowBasis": "published UK classroom case study; fictional comparison only" if reference_case else "room-specific assessed airflow",
        },
        "schedule": {
            "name": selected_candidate.name,
            "openingAllowed": bool(opening_policy["allowOpening"]),
            "windowsOpenAt": open_windows,
            "candidateCount": len(results),
            "selectionReason": selection_reason,
            "co2Feasible": selected["co2Feasible"],
            "closedAndRisingCo2Warning": closed_and_rising,
        },
        "summary": {
            "integratedIndoorPm25UgHourM3": selected["integratedPm25UgHourM3"],
            "maxEstimatedIndoorPm25UgM3": selected["maxPm25UgM3"],
            "maxEstimatedIndoorCo2Ppm": selected["maxCo2Ppm"],
            "co2GoodVentilationIndicatorMet": selected["co2GoodIndicatorMet"],
            "co2ConcernIndicatorPpm": float(_CONFIG["co2"]["concernPpm"]["value"]),
        },
        "steps": selected["steps"],
        "assumptions": copy.deepcopy(
            {
                "schoolDay": _CONFIG["schoolDay"],
                "defaults": _CONFIG["defaults"],
                "pm25": _CONFIG["pm25"],
                "co2": _CONFIG["co2"],
                "openingPolicy": _CONFIG["openingPolicy"],
                "methodSources": _CONFIG["methodSources"],
                "limitations": _CONFIG["limitations"],
            }
        ),
    }
