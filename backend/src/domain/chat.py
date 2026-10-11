"""Grounded conversational agent for ClearClass using Strands and Bedrock Nova Micro.

The agent is strictly tool-grounded: rules and physics decide; the model only
explains, translates, and formats answers. It never invents medical claims,
universal safe minutes, or cross-jurisdictional legal clearance.
"""

from __future__ import annotations

from datetime import date
import re
import json
import os
from typing import Any
from zoneinfo import ZoneInfo

from strands import Agent, tool
from strands.models import BedrockModel

from .advice import school_hour_reference
from .models import AirSnapshot, Location
from .policy import evaluate_reference
from .ventilation import estimate_ventilation


SYSTEM_PROMPT = """You are ClearClass Assistant, a decision-support guide for school staff.
Rules and physical models decide; you only explain, translate, and converse.

Operational constraints:
1. Ground all answers in tool results (get_school_profile, get_air_quality, evaluate_policy, plan_ventilation).
2. Lead with an immediate, clear stance: Allowed, Modified (with specific measures), Denied, or Withheld (due to unavailable/out-of-range data).
3. If an activity is modified, specify the exact source-backed measures: more breaks, reduced intensity, or indoor relocation. Never invent safe minutes, ages, or duration limits.
4. For indoor activities, remind staff that indoor relocation depends on indoor air suitability and functioning ventilation/filtration.
5. All outdoor activity guidance is a project reference adaptation based on U.S. EPA/AirNow guidelines. It is NOT official local law, CPCB AQI, or CAQM GRAP. Never cite Delhi GRAP for London or other locations.
6. For ventilation, state that recommendations are single-zone mass-balance physical estimates, not sensor measurements.
7. If the user asks in Hindi or requests Hindi, reply naturally in Hindi (Devanagari script). Otherwise reply in English.
8. Keep answers professional, concise, and focused on staff operational decision-making before school bell.
"""


def create_tools(
    school: dict,
    location: Location,
    snapshot: AirSnapshot | None,
    air_status: str,
    local_date: str,
    scenario: str | None,
    policy_pack=None,
):
    """Create a suite of 4 server-side tools closed over the current request context."""
    local_date_obj = date.fromisoformat(local_date) if isinstance(local_date, str) else local_date

    @tool
    def get_school_profile() -> str:
        """Return the school profile, resolved location, coordinates, country, and IANA timezone."""
        return json.dumps({
            "schoolId": school["id"],
            "schoolName": school["name"],
            "location": {
                "id": location.id,
                "name": location.name,
                "country": location.country,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "timezone": location.timezone,
            },
            "localDate": local_date_obj.isoformat(),
            "scenario": scenario,
        })

    @tool
    def get_air_quality() -> str:
        """Return the current location's modelled PM2.5, PM10, reference U.S. AQI, and data age."""
        if snapshot is None:
            return json.dumps({
                "status": air_status,
                "message": "Air quality data currently unavailable for this location.",
            })

        school_air = school_hour_reference(snapshot, location, local_date_obj)
        return json.dumps({
            "status": air_status,
            "dataSource": snapshot.source,
            "domain": snapshot.domain,
            "schoolHourRefAqi": school_air.get("value"),
            "hourlySampleCount": len(snapshot.hourly),
            "isSyntheticScenario": scenario is not None,
            "disclaimer": "CAMS Global atmospheric model forecast (~45km resolution); not an on-site station measurement.",
        })

    @tool
    def evaluate_policy(activity: str, cohort: str = "all_students") -> str:
        """Evaluate formal Cedar reference outdoor activity policy.

        Activities: 'assembly', 'pe', 'recess', 'sports'.
        Cohorts: 'all_students', 'sensitive_pupils'.
        """
        policy_activity = "prolonged_intense_sport" if activity.lower() in ("sports", "athletics") else "ordinary"
        stale = air_status in ("cached_stale", "unavailable")

        ref_air = school_hour_reference(snapshot, location, local_date_obj) if snapshot else {}
        aqi_val = ref_air.get("value")

        outcome = evaluate_reference(
            aqi_val, policy_activity, cohort, stale=stale, policy_pack=policy_pack
        )
        return json.dumps({
            "activity": activity,
            "cohort": cohort,
            "decision": outcome["decision"],
            "status": outcome["status"],
            "selectedAction": outcome.get("selectedAction"),
            "ruleIds": outcome.get("matchedPolicyIds", []),
            "modifications": outcome.get("modifications", []),
            "sensitivePupilCaveat": outcome.get("sensitivePupilCaveat"),
            "indoorAirCaveat": outcome.get("indoorAirCaveat"),
            "basis": outcome.get("basis", "reference_advisory"),
            "policySetVersion": outcome.get("policySetVersion"),
        })

    @tool
    def plan_ventilation() -> str:
        """Return recommended classroom window opening intervals, peak CO2, and mass-balance estimates."""
        if snapshot is None or air_status == "cached_stale":
            return json.dumps({
                "status": "unavailable",
                "message": "Ventilation estimates unavailable because same-place hourly air forecast is missing or stale.",
            })

        raw = estimate_ventilation(snapshot, location, local_date_obj, reference_case=True)
        if raw.get("status") != "estimated":
            return json.dumps(raw)

        sched = raw.get("schedule", {})
        summ = raw.get("summary", {})
        return json.dumps({
            "status": "estimated",
            "scheduleName": sched.get("name"),
            "windowsOpenAt": sched.get("windowsOpenAt", []),
            "co2Feasible": sched.get("co2Feasible"),
            "maxEstimatedCo2Ppm": summ.get("maxEstimatedIndoorCo2Ppm"),
            "integratedPm25": summ.get("integratedIndoorPm25UgHourM3"),
            "modelDisclaimer": "Estimated from differential mass-balance equations; not measured by sensors.",
        })

    return [get_school_profile, get_air_quality, evaluate_policy, plan_ventilation]


def answer_question(
    message: str,
    school: dict,
    location: Location,
    snapshot: AirSnapshot | None,
    air_status: str,
    local_date: str,
    scenario: str | None,
    history: list[dict[str, str]] | None = None,
    policy_pack=None,
    model_id: str | None = None,
) -> dict[str, Any]:
    """Execute grounded Strands agent and return formatted reply with tool call trace."""
    tools = create_tools(
        school=school,
        location=location,
        snapshot=snapshot,
        air_status=air_status,
        local_date=local_date,
        scenario=scenario,
        policy_pack=policy_pack,
    )

    actual_model_id = model_id or os.environ.get("BEDROCK_MODEL_ID", "amazon.nova-micro-v1:0")
    model = BedrockModel(
        model_id=actual_model_id,
        region_name=os.environ.get("AWS_REGION", "ap-southeast-2"),
        streaming=False,
        max_tokens=512,
        temperature=0,
    )

    agent = Agent(
        model=model,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )

    # Format user prompt incorporating bounded history if present
    prompt = message
    if history and len(history) > 0:
        bounded_history = history[-6:]
        history_lines = [f"{turn['role'].capitalize()}: {turn['content']}" for turn in bounded_history]
        prompt = f"Conversation history:\n" + "\n".join(history_lines) + f"\n\nUser Question: {message}"

    try:
        response_text = str(agent(prompt))
        clean_text = re.sub(r"<thinking>.*?</thinking>", "", response_text, flags=re.DOTALL).strip()
        if not clean_text:
            clean_text = response_text.replace("<thinking>", "").replace("</thinking>", "").strip()
        return {
            "reply": clean_text,
            "modelId": actual_model_id,
            "status": "success",
        }
    except Exception as error:
        # Graceful deterministic fallback
        fallback = _deterministic_fallback(message, location, snapshot, air_status, local_date)
        return {
            "reply": fallback,
            "modelId": actual_model_id,
            "status": "fallback",
            "error": str(error),
        }


def _deterministic_fallback(
    message: str,
    location: Location,
    snapshot: AirSnapshot | None,
    air_status: str,
    local_date: str = "2026-10-10",
) -> str:
    """Return a deterministic grounded response when Bedrock is unavailable."""
    local_date_obj = date.fromisoformat(local_date) if isinstance(local_date, str) else local_date
    if snapshot is None:
        return f"Air data for {location.name} is currently unavailable. Please follow official school and local authority directives."

    school_air = school_hour_reference(snapshot, location, local_date_obj)
    ref_aqi = school_air.get("value", "unknown")
    return (
        f"For {location.name} on this date, the modelled U.S. AQI reference input is {ref_aqi}. "
        f"Outdoor activity decisions follow project reference guidelines (EPA AirNow adaptation). "
        f"For sports and intense activities, reduce intensity and take frequent breaks when AQI is elevated. "
        f"Indoor activities depend on indoor air quality. Always follow current school and authority directives."
    )
