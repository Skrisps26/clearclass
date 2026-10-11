"""Deterministic, bilingual parent-message rendering for daily school cards.

The renderer deliberately translates only evaluated reference-policy verdicts.  A
Cedar default deny or a verdict withheld for missing, stale, or unavailable data is
reported as *no current recommendation*, never as an official prohibition.
"""

from __future__ import annotations

from typing import Any


_EVALUATED = "evaluated"
_WITHHELD = {"insufficient_data", "stale", "unavailable"}


def _text(value: object, fallback: str) -> str:
    """Return a compact display value without accepting a non-string as content."""
    if not isinstance(value, str):
        return fallback
    normalized = " ".join(value.split())
    return normalized or fallback


def _activity(verdict: dict[str, Any]) -> tuple[str, str]:
    """Name the activity in parent-facing language from its stable policy action."""
    activity = verdict.get("activity") or verdict.get("activityType") or verdict.get("selectedAction")
    if activity == "assembly":
        return "outdoor assembly", "बाहरी सभा"
    if activity == "recess":
        return "outdoor recess", "बाहरी अवकाश"
    if activity == "sports":
        return "prolonged/intense sport", "लंबे समय का/तेज़ खेल"
    if activity in {"ordinary", "ordinary_outdoor", "ordinary_with_breaks_reduced_intensity"}:
        return "outdoor assembly/recess", "बाहरी सभा/अवकाश"
    if activity in {"pe", "physical_education", "physical-education"}:
        return "PE", "पीई"
    if activity in {
        "prolonged_intense_sport",
        "sport_with_breaks_reduced_intensity",
        "prolonged-intense-sport",
    }:
        return "prolonged/intense sport", "लंबे समय का/तेज़ खेल"
    if activity == "indoor_relocation_or_reschedule":
        return "outdoor activity", "बाहरी गतिविधि"
    return "this outdoor activity", "यह बाहरी गतिविधि"


def _evaluated_action(verdict: dict[str, Any], activity_en: str, activity_hi: str) -> tuple[str, str]:
    """Render an evaluated decision without inventing a duration or safety claim."""
    decision = verdict.get("decision")
    selected = verdict.get("selectedAction")

    if decision == "allow":
        display_activity = activity_en if activity_en == "PE" else activity_en.capitalize()
        return (
            f"{display_activity} may go ahead under this reference guidance.",
            f"इस संदर्भ सलाह के अनुसार {activity_hi} कराई जा सकती है।",
        )
    if decision == "modify":
        if selected == "indoor_relocation_or_reschedule":
            return (
                f"Move {activity_en} indoors or reschedule it, only if indoor air is suitable.",
                f"{activity_hi} को भीतर कराएं या पुनर्निर्धारित करें, लेकिन केवल तभी जब भीतर की हवा उपयुक्त हो।",
            )
        return (
            f"For {activity_en}, use lower intensity and more breaks.",
            f"{activity_hi} के लिए तीव्रता कम रखें और अधिक विराम दें।",
        )
    return (
        f"No source-backed reference recommendation was found for {activity_en}; ask the school to review.",
        f"{activity_hi} के लिए स्रोत-समर्थित संदर्भ सलाह नहीं मिली; स्कूल से समीक्षा कराएं।",
    )


def _withheld_action(status: str, activity_en: str, activity_hi: str) -> tuple[str, str]:
    """Explain a withheld decision separately from Cedar's evaluated default deny."""
    reasons = {
        "insufficient_data": (
            "the needed reference data are incomplete",
            "ज़रूरी संदर्भ डेटा अधूरा है",
        ),
        "stale": (
            "the reference data are stale",
            "संदर्भ डेटा पुराना है",
        ),
        "unavailable": (
            "the reference guidance or data are unavailable",
            "संदर्भ सलाह या डेटा उपलब्ध नहीं है",
        ),
    }
    reason_en, reason_hi = reasons[status]
    return (
        f"No current reference recommendation is available for {activity_en} because {reason_en}; this is not an official ban.",
        f"{activity_hi} के लिए अभी कोई संदर्भ सलाह उपलब्ध नहीं है क्योंकि {reason_hi}; यह आधिकारिक प्रतिबंध नहीं है।",
    )


def _air_caveat(air_status: str, scenario: bool) -> tuple[str, str]:
    """State source adequacy without replacing verdict-level explanations."""
    if scenario:
        return (
            "This is a synthetic scenario, not actual local air.",
            "यह एक कृत्रिम परिदृश्य है, स्थानीय वायु का वास्तविक माप नहीं है।",
        )
    if air_status in {"unavailable", "insufficient_data"}:
        return (
            "Current air data for this place are unavailable; use the school and local authority's current directions.",
            "इस स्थान का वर्तमान वायु डेटा उपलब्ध नहीं है; स्कूल और स्थानीय प्राधिकरण के मौजूदा निर्देशों का पालन करें।",
        )
    if air_status in {"cached_stale", "stale"}:
        return (
            "The available air data are stale; use the school and local authority's current directions.",
            "उपलब्ध वायु डेटा पुराना है; स्कूल और स्थानीय प्राधिकरण के मौजूदा निर्देशों का पालन करें।",
        )
    return (
        "This uses a forecast/model, not a measurement or official local AQI.",
        "यह पूर्वानुमान/मॉडल पर आधारित है, माप या आधिकारिक स्थानीय AQI नहीं है।",
    )


def render_parent_messages(
    verdicts: list[dict], location_name: str, scenario: bool, air_status: str
) -> dict[str, str]:
    """Return ready-to-copy deterministic English and Hindi school messages.

    The output is project reference guidance only.  It does not infer local
    directives, make a school-closure claim, or turn an unevaluated Cedar denial
    into a pollution prohibition.
    """
    location = _text(location_name, "the selected place")
    air_status = _text(air_status, "unavailable")

    en_lines = [f"ClearClass school activity update for {location}."]
    hi_lines = [f"{location} के लिए ClearClass स्कूल गतिविधि सूचना।"]

    seen_actions: set[tuple] = set()
    sensitive_caveat = False
    for verdict in verdicts:
        if not isinstance(verdict, dict):
            continue
        sensitive_caveat = sensitive_caveat or bool(verdict.get("sensitivePupilCaveat"))
        action_key = (
            verdict.get("activity"), verdict.get("decision"),
            verdict.get("status"), verdict.get("selectedAction"),
        )
        if action_key in seen_actions:
            continue
        seen_actions.add(action_key)
        activity_en, activity_hi = _activity(verdict)
        status = verdict.get("status")
        if status == _EVALUATED:
            action_en, action_hi = _evaluated_action(verdict, activity_en, activity_hi)
        elif status in _WITHHELD:
            action_en, action_hi = _withheld_action(status, activity_en, activity_hi)
        else:
            action_en = (
                f"No current reference recommendation is available for {activity_en}; this is not an official ban."
            )
            action_hi = f"{activity_hi} के लिए अभी कोई संदर्भ सलाह उपलब्ध नहीं है; यह आधिकारिक प्रतिबंध नहीं है।"
        en_lines.append(action_en)
        hi_lines.append(action_hi)

    if not en_lines[1:]:
        en_lines.append("No activity recommendation was supplied; use the school and local authority's current directions.")
        hi_lines.append("कोई गतिविधि सलाह उपलब्ध नहीं है; स्कूल और स्थानीय प्राधिकरण के मौजूदा निर्देशों का पालन करें।")

    if sensitive_caveat:
        en_lines.append("For sensitive pupils, watch for symptoms and follow individual asthma action plans where applicable.")
        hi_lines.append("संवेदनशील विद्यार्थियों में लक्षणों पर ध्यान दें और जहाँ लागू हो वहाँ उनकी व्यक्तिगत अस्थमा कार्ययोजना का पालन करें।")
    air_en, air_hi = _air_caveat(air_status, scenario)
    en_lines.extend(
        [
            air_en,
            "This is project reference guidance only; local school directives are not integrated.",
            "It is not an official local AQI, CPCB AQI, or GRAP instruction. It is not a school-closure notice. Follow current school and local-authority directions.",
        ]
    )
    hi_lines.extend(
        [
            air_hi,
            "यह केवल परियोजना की संदर्भ सलाह है; स्थानीय स्कूल निर्देश इसमें शामिल नहीं हैं।",
            "यह आधिकारिक स्थानीय AQI, CPCB AQI या GRAP निर्देश नहीं है। यह स्कूल बंद होने की सूचना नहीं है। स्कूल और स्थानीय प्राधिकरण के मौजूदा निर्देशों का पालन करें।",
        ]
    )
    return {"en": " ".join(en_lines), "hi": " ".join(hi_lines)}
