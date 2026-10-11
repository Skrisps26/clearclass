"""Apply one validated Cedar pack to selected-place school-hour forecast inputs."""

from bisect import bisect_right
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from .models import AirSnapshot, Location
from .policy import evaluate_reference


ACTIVITIES = (
    ("assembly", "ordinary"),
    ("pe", "ordinary"),
    ("recess", "ordinary"),
    ("sports", "prolonged_intense_sport"),
)
COHORTS = ("all_students", "sensitive_pupils")


def school_hour_reference(snapshot: AirSnapshot | None, location: Location, local_date: date) -> dict:
    """Use the worst U.S.-AQI reference value in a complete 08:00–14:30 local day.

    Sample the most recent actual provider hour at each five-minute school-day
    step; do not round non-hour IANA offsets or fill a missing forecast hour.
    The maximum is a conservative *modelled* index input, not an observation.
    """
    if snapshot is None or snapshot.locationId != location.id:
        return {"value": None, "validTimes": [], "reason": "Selected-place school-hour air data unavailable."}
    zone = ZoneInfo(location.timezone)
    start = datetime.combine(local_date, time(8), tzinfo=zone).astimezone(UTC)
    end = datetime.combine(local_date, time(14, 30), tzinfo=zone).astimezone(UTC)
    samples = [(hour.time.astimezone(UTC), hour.referenceAqi) for hour in snapshot.hourly]
    instants = [instant for instant, _ in samples]
    values = []
    used = set()
    step = start
    while step < end:
        index = bisect_right(instants, step) - 1
        if index < 0 or step - instants[index] >= timedelta(hours=1) or samples[index][1] is None:
            return {"value": None, "validTimes": [], "reason": "A school-hour reference forecast is missing."}
        values.append(samples[index][1])
        used.add(instants[index])
        step += timedelta(minutes=5)
    return {
        "value": max(values),
        "validTimes": [instant.isoformat() for instant in sorted(used)],
        "reason": "Maximum hourly modelled U.S. AQI over school-local 08:00–14:30; not official local AQI.",
    }

def school_verdicts(
    snapshot: AirSnapshot | None,
    location: Location,
    local_date: date,
    status: str,
    policy_pack=None,
    *,
    require_remote_policy: bool = False,
) -> tuple[list[dict], dict]:
    input_air = school_hour_reference(snapshot, location, local_date)
    stale = status == "cached_stale"
    verdicts = []
    for activity, policy_activity in ACTIVITIES:
        for cohort in COHORTS:
            outcome = (
                {
                    "decision": "deny", "status": "unavailable", "matchedPolicyIds": [],
                    "sources": [], "modifications": [], "basis": "reference_advisory",
                    "policySetVersion": None,
                }
                if require_remote_policy and policy_pack is None
                else evaluate_reference(
                    input_air["value"], policy_activity, cohort,
                    stale=stale, policy_pack=policy_pack,
                )
            )
            verdicts.append({
                "activity": activity,
                "cohort": cohort,
                "decision": outcome["decision"],
                "status": outcome["status"],
                "selectedAction": outcome.get("selectedAction"),
                "matchedPolicyIds": outcome["matchedPolicyIds"],
                "sources": outcome["sources"],
                "modifications": outcome["modifications"],
                "sensitivePupilCaveat": outcome.get("sensitivePupilCaveat") if cohort == "sensitive_pupils" else None,
                "indoorAirCaveat": outcome.get("indoorAirCaveat"),
                "referenceAqiInput": input_air["value"],
                "forecastValidTimes": input_air["validTimes"],
                "inputDescription": input_air["reason"],
                "basis": outcome["basis"],
                "policySetVersion": outcome["policySetVersion"],
            })
    return verdicts, input_air
