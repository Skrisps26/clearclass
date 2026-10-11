"""Cedar-backed EPA/AirNow outdoor-activity reference guidance.

This module evaluates a versioned project reference adaptation of U.S. EPA/AirNow
school guidance.  It is not an official local directive and must never be used to
claim local regulatory clearance.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import json
from pathlib import Path
import re
from typing import Any, Mapping

from cedarpy import Decision, PolicySet, Schema, is_authorized, validate_policies


_PACK_DIRECTORY = (
    Path(__file__).resolve().parents[2]
    / "policies"
    / "packs"
    / "reference-school-activity"
)
_SUPPORTED_SCHEME = "US_AQI"
_SAFE_COHORT_ID = re.compile(r"^[A-Za-z0-9_-]+$")

# Candidates are ordered from least to most restrictive.  Each action is evaluated
# independently by Cedar; the first permitted candidate becomes the recommendation.
_ACTIVITY_CANDIDATES: Mapping[str, tuple[tuple[str, str, tuple[str, ...]], ...]] = {
    "ordinary": (
        ("ordinary_outdoor", "allow", ()),
        (
            "ordinary_with_breaks_reduced_intensity",
            "modify",
            ("Take more breaks and use less intense activity.",),
        ),
        (
            "indoor_relocation_or_reschedule",
            "modify",
            ("Move activities indoors or reschedule them.",),
        ),
    ),
    "prolonged_intense_sport": (
        ("prolonged_intense_sport", "allow", ()),
        (
            "sport_with_breaks_reduced_intensity",
            "modify",
            ("Take more breaks and use less intense activity.",),
        ),
        (
            "indoor_relocation_or_reschedule",
            "modify",
            ("Move activities indoors or reschedule them.",),
        ),
    ),
}

def _sensitive_pupil_caveat(aqi: int) -> str | None:
    """Return only the category-appropriate caveat stated in the source guide."""
    if 51 <= aqi <= 100:
        return "Students who are unusually sensitive to air pollution could have symptoms."
    if 101 <= aqi <= 200:
        return (
            "Watch for symptoms and take action as needed; students with asthma should "
            "follow their asthma action plans and keep quick-relief medicine handy."
        )
    return None
_INDOOR_CAVEAT = (
    "This reference adaptation does not establish that indoor air is suitable; "
    "indoor activity depends on the pollutant and the building's filtration and ventilation."
)


@dataclass(frozen=True)
class _ReferencePack:
    """Parsed, schema-validated immutable policy pack."""

    manifest: Mapping[str, Any]
    schema: Schema
    policies: PolicySet


def _read_pack_file(name: str) -> str:
    """Read a pack-relative file only after its filename is declared by the manifest."""
    path = _PACK_DIRECTORY / name
    if path.parent != _PACK_DIRECTORY or not path.is_file():
        raise ValueError(f"missing reference policy pack file: {name}")
    return path.read_text(encoding="utf-8")


def validated_reference_pack(manifest: dict[str, Any], schema_text: str, policies_text: str) -> _ReferencePack:
    """Reject untrusted S3 revisions before they can replace a valid pack."""
    if manifest.get("packId") != "reference-school-activity":
        raise ValueError("unexpected reference policy pack ID")
    if not isinstance(manifest.get("version"), str) or not manifest["version"]:
        raise ValueError("reference policy pack requires a version")
    if manifest.get("expectedAqiScheme") != _SUPPORTED_SCHEME:
        raise ValueError("reference policy pack must declare US_AQI")
    if manifest.get("basis") != "reference_advisory" or not manifest.get("active"):
        raise ValueError("reference policy pack is not an active advisory pack")
    if not isinstance(manifest.get("sources"), list) or not isinstance(manifest.get("policySources"), dict):
        raise ValueError("reference policy pack requires source evidence")
    schema = Schema.from_str(schema_text)
    validation = validate_policies(policies_text, schema)
    if not validation.validation_passed:
        raise ValueError("reference Cedar validation failed")
    return _ReferencePack(manifest=manifest, schema=schema, policies=PolicySet.from_str(policies_text))


@lru_cache(maxsize=1)
def _load_reference_pack() -> _ReferencePack:
    manifest = json.loads(_read_pack_file("manifest.json"))
    if not isinstance(manifest, dict):
        raise ValueError("reference policy manifest must be an object")
    schema_name = manifest.get("schema")
    policies_name = manifest.get("policies")
    if not isinstance(schema_name, str) or not isinstance(policies_name, str):
        raise ValueError("reference policy manifest lacks schema or policy filename")
    return validated_reference_pack(
        manifest, _read_pack_file(schema_name), _read_pack_file(policies_name)
    )


def validate_reference_pack() -> dict[str, Any]:
    """Validate and describe the packaged Cedar reference policy before deployment."""
    pack = _load_reference_pack()
    return {
        "packId": pack.manifest["packId"],
        "policySetVersion": pack.manifest["version"],
        "expectedAqiScheme": pack.manifest["expectedAqiScheme"],
        "basis": pack.manifest["basis"],
        "regulatoryCoverage": "reference_only",
        "sources": list(pack.manifest["sources"]),
        "localPolicyOverlay": dict(pack.manifest["localPolicyOverlay"]),
    }


def _policy_ids(result: Any) -> list[str]:
    """Return stable @id annotation values for Cedar determining policies."""
    diagnostics = getattr(result, "diagnostics", None)
    reasons = getattr(diagnostics, "reasons", ()) or ()
    annotations = getattr(diagnostics, "id_annotations_by_reason", {}) or {}
    ids: list[str] = []
    for reason in reasons:
        annotation = annotations.get(reason)
        policy_id = str(annotation if annotation is not None else reason)
        if policy_id not in ids:
            ids.append(policy_id)
    return ids


def _diagnostic_errors(result: Any) -> list[str]:
    diagnostics = getattr(result, "diagnostics", None)
    return [str(error) for error in (getattr(diagnostics, "errors", ()) or ())]


def _sources_for(pack: _ReferencePack, policy_ids: list[str]) -> list[dict[str, Any]]:
    by_id = {source["id"]: source for source in pack.manifest["sources"]}
    source_ids: list[str] = []
    for policy_id in policy_ids:
        for source_id in pack.manifest["policySources"].get(policy_id, []):
            if source_id not in source_ids:
                source_ids.append(source_id)
    return [dict(by_id[source_id]) for source_id in source_ids]


def _authorize(
    pack: _ReferencePack, *, action: str, aqi: int, cohort: str
) -> dict[str, Any]:
    """Evaluate one candidate action, preserving Cedar's determining evidence."""
    result = is_authorized(
        {
            "principal": 'Staff::"reference-evaluator"',
            "action": f'Action::"{action}"',
            "resource": 'School::"reference-school"',
            "context": {
                "aqi": aqi,
                "cohort": {"__entity": {"type": "Cohort", "id": cohort}},
            },
        },
        pack.policies,
        [],
    )
    policy_ids = _policy_ids(result)
    return {
        "action": action,
        "allowed": result.decision == Decision.Allow,
        "matchedPolicyIds": policy_ids,
        "sources": _sources_for(pack, policy_ids),
        "errors": _diagnostic_errors(result),
    }


def _base_response(pack: _ReferencePack, *, decision: str, status: str) -> dict[str, Any]:
    return {
        "decision": decision,
        "status": status,
        "matchedPolicyIds": [],
        "sources": [],
        "modifications": [],
        "sensitivePupilCaveat": None,
        "policySetVersion": pack.manifest["version"],
        "regulatoryCoverage": "reference_only",
        "basis": "reference_advisory",
    }


def evaluate_reference(
    aqi: int | None,
    activity: str,
    cohort: str,
    *,
    scheme: str = _SUPPORTED_SCHEME,
    stale: bool = False,
    policy_pack: _ReferencePack | None = None,
) -> dict[str, Any]:
    """Evaluate the U.S.-AQI reference pack without asserting local legal status.

    ``decision == "deny"`` with any status other than ``"evaluated"`` means the
    evaluator withheld a recommendation; it is not evidence of a pollution ban.
    """
    try:
        pack = policy_pack if policy_pack is not None else _load_reference_pack()
    except Exception:  # A failed initial pack must never allow activity.
        return {
            "decision": "deny",
            "status": "unavailable",
            "matchedPolicyIds": [],
            "sources": [],
            "modifications": [],
            "sensitivePupilCaveat": None,
            "policySetVersion": None,
            "regulatoryCoverage": "reference_only",
            "basis": "reference_advisory",
            "reason": "Reference policy pack is unavailable.",
        }

    if stale:
        response = _base_response(pack, decision="deny", status="stale")
        response["reason"] = "Reference AQI input is stale; no current activity recommendation was evaluated."
        return response
    if scheme != _SUPPORTED_SCHEME:
        response = _base_response(pack, decision="deny", status="insufficient_data")
        response["reason"] = "Reference guidance requires a U.S. AQI value; another AQI scheme was supplied."
        return response
    if type(aqi) is not int or aqi < 0:
        response = _base_response(pack, decision="deny", status="insufficient_data")
        response["reason"] = "A non-negative U.S. AQI value is required to evaluate reference guidance."
        return response
    if not isinstance(cohort, str) or not _SAFE_COHORT_ID.fullmatch(cohort):
        response = _base_response(pack, decision="deny", status="insufficient_data")
        response["reason"] = "A valid configured cohort identifier is required to evaluate reference guidance."
        return response
    if aqi > 300:
        response = _base_response(pack, decision="deny", status="unavailable")
        response["reason"] = (
            "The school guide has no action category above U.S. AQI 300; "
            "no reference recommendation was evaluated."
        )
        return response

    candidates = _ACTIVITY_CANDIDATES.get(activity)
    if candidates is None:
        response = _base_response(pack, decision="deny", status="evaluated")
        response["reason"] = "No applicable permission exists for this activity in the reference pack."
        return response

    evaluations: list[dict[str, Any]] = []
    try:
        for action, decision, modifications in candidates:
            evaluation = _authorize(pack, action=action, aqi=aqi, cohort=cohort)
            evaluations.append(evaluation)
            if evaluation["errors"]:
                raise RuntimeError("Cedar evaluation returned diagnostics")
            if evaluation["allowed"]:
                response = _base_response(pack, decision=decision, status="evaluated")
                response["matchedPolicyIds"] = evaluation["matchedPolicyIds"]
                response["sources"] = evaluation["sources"]
                response["modifications"] = list(modifications)
                response["sensitivePupilCaveat"] = _sensitive_pupil_caveat(aqi)
                response["selectedAction"] = action
                response["evaluations"] = evaluations
                if action == "indoor_relocation_or_reschedule":
                    response["indoorAirCaveat"] = _INDOOR_CAVEAT
                return response
    except Exception:
        response = _base_response(pack, decision="deny", status="unavailable")
        response["reason"] = "Reference guidance could not be evaluated."
        response["evaluations"] = evaluations
        return response

    response = _base_response(pack, decision="deny", status="evaluated")
    response["reason"] = "No applicable permission exists for this activity and U.S. AQI value."
    response["evaluations"] = evaluations
    return response
