import sys
import unittest
from pathlib import Path

from cedarpy import Decision, Schema, is_authorized, validate_policies

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from spike import POLICIES, SCHEMA, evaluate_cedar, handler


class CedarSpikeTests(unittest.TestCase):
    def test_permit_forbid_and_default_deny(self):
        self.assertEqual(
            evaluate_cedar(),
            {"validation": "passed", "allow": True, "forbid": True, "defaultDeny": True},
        )
        self.assertEqual(handler({"mode": "cedar"}, None)["modelInvoked"], False)

    def test_explicit_forbid_takes_precedence_over_permit(self):
        both = POLICIES + '\n@id("spike.duplicate-permit")\npermit(principal, action == Action::"advise", resource) when { context.status == "blocked" };'
        self.assertTrue(validate_policies(both, Schema.from_str(SCHEMA)).validation_passed)
        result = is_authorized(
            {
                "principal": 'Staff::"demo"',
                "action": 'Action::"advise"',
                "resource": 'School::"demo"',
                "context": {"status": "blocked"},
            },
            both,
            [],
        )
        self.assertEqual(result.decision, Decision.Deny)

    def test_unknown_action_is_rejected_by_schema(self):
        invalid = 'permit(principal, action == Action::"notInSchema", resource);'
        self.assertFalse(validate_policies(invalid, Schema.from_str(SCHEMA)).validation_passed)


if __name__ == "__main__":
    unittest.main()
