"""M0 packaging proof: execute Cedar validation/authorization and a bounded Strands call.

A real Lambda invocation is required before M0 is verified; local runs prove only
that this code and its native dependencies work on the local interpreter.
"""

import os

from cedarpy import Decision, PolicySet, Schema, is_authorized, validate_policies
from strands import Agent
from strands.models import BedrockModel


SCHEMA = """
entity Staff;
entity School;
action advise appliesTo {
    principal: Staff,
    resource: School,
    context: { status: String }
};
"""

POLICIES = """
@id("spike.permit")
permit (principal, action == Action::"advise", resource)
when { context.status == "ready" };
@id("spike.forbid")
forbid (principal, action == Action::"advise", resource)
when { context.status == "blocked" };
"""


def evaluate_cedar() -> dict:
    """Prove schema validation, permit, explicit forbid and default deny."""
    schema = Schema.from_str(SCHEMA)
    validation = validate_policies(POLICIES, schema)
    if not validation.validation_passed:
        raise ValueError(f"Cedar schema validation failed: {validation.errors}")
    policies = PolicySet.from_str(POLICIES)
    base = {
        "principal": 'Staff::"demo"',
        "action": 'Action::"advise"',
        "resource": 'School::"demo"',
    }
    results = {}
    for status in ("ready", "blocked", "unknown"):
        outcome = is_authorized(
            {**base, "context": {"status": status}}, policies, []
        )
        results[status] = outcome.decision == Decision.Allow
    if results != {"ready": True, "blocked": False, "unknown": False}:
        raise RuntimeError(f"Unexpected Cedar result: {results}")
    return {"validation": "passed", "allow": results["ready"], "forbid": not results["blocked"], "defaultDeny": not results["unknown"]}


def handler(event: dict, _context: object) -> dict:
    cedar = evaluate_cedar()
    if event.get("mode") == "cedar":
        return {"cedar": cedar, "modelInvoked": False}
    if event.get("mode") != "model":
        raise ValueError("mode must be cedar or model")
    model_id = os.environ["BEDROCK_MODEL_ID"]
    model = BedrockModel(
        model_id=model_id,
        region_name="ap-southeast-2",
        streaming=False,
        max_tokens=64,
        temperature=0,
    )
    agent = Agent(
        model=model,
        tools=[],
        system_prompt="Reply with only the word ready. No school or health advice.",
    )
    answer = str(agent("Reply with the word ready."))
    if not answer:
        raise RuntimeError("Empty Bedrock response")
    return {"cedar": cedar, "modelInvoked": True, "modelId": model_id, "answer": answer}
