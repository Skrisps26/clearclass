import io
import json
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.handlers.policy import handle_policy
from tests.test_brief import FakeS3


VALID_POLICIES = """
@id("test.permit")
permit (principal, action == Action::"ordinary_outdoor", resource)
when { context.aqi >= 0 && context.aqi <= 100 };
"""

INVALID_POLICIES = """
permit (principal, action == Action::"nonexistent_action", resource);
"""


class PolicyApiTests(unittest.TestCase):
    def setUp(self):
        self.s3 = FakeS3()
        self.bucket = "test-bucket"

    def event(self, method="GET", path="/policy", params=None, body=None, headers=None):
        return {
            "routeKey": f"{method} /policy",
            "queryStringParameters": params or {},
            "body": json.dumps(body) if isinstance(body, dict) else body,
            "headers": headers or {},
            "requestContext": {"http": {"method": method, "path": path}},
        }

    def test_get_policy_returns_manifest_schema_and_policies(self):
        res = handle_policy(self.event("GET", params={"packId": "reference-school-activity"}), self.s3, self.bucket)
        self.assertEqual(res["statusCode"], 200)
        data = json.loads(res["body"])
        self.assertEqual(data["packId"], "reference-school-activity")
        self.assertTrue(data["schema"])
        self.assertTrue(data["policies"])

    def test_get_policy_unknown_pack_returns_404(self):
        res = handle_policy(self.event("GET", params={"packId": "unknown-pack"}), self.s3, self.bucket)
        self.assertEqual(res["statusCode"], 404)

    def test_post_validate_valid_policies(self):
        res = handle_policy(self.event("POST", body={"policies": VALID_POLICIES}), self.s3, self.bucket)
        self.assertEqual(res["statusCode"], 200)
        data = json.loads(res["body"])
        self.assertTrue(data["valid"])

    def test_post_validate_invalid_policies(self):
        res = handle_policy(self.event("POST", body={"policies": INVALID_POLICIES}), self.s3, self.bucket)
        self.assertEqual(res["statusCode"], 200)
        data = json.loads(res["body"])
        self.assertFalse(data["valid"])
        self.assertTrue(data["errors"])

    def test_put_policy_requires_authorization_bearer_token(self):
        unauth = handle_policy(self.event("PUT", body={"newVersion": "2026-10-12.1", "policies": VALID_POLICIES}), self.s3, self.bucket)
        self.assertEqual(unauth["statusCode"], 401)

        wrong_token = handle_policy(
            self.event("PUT", body={"newVersion": "2026-10-12.1", "policies": VALID_POLICIES}, headers={"authorization": "Bearer wrong"}),
            self.s3, self.bucket
        )
        self.assertEqual(wrong_token["statusCode"], 401)

    def test_put_policy_rejects_invalid_cedar_with_422(self):
        res = handle_policy(
            self.event(
                "PUT",
                body={"newVersion": "2026-10-12.1", "policies": INVALID_POLICIES},
                headers={"authorization": "Bearer clearclass-hackathon-2026-admin"},
            ),
            self.s3, self.bucket
        )
        self.assertEqual(res["statusCode"], 422)

    def test_put_policy_succeeds_with_valid_token_and_valid_syntax(self):
        res = handle_policy(
            self.event(
                "PUT",
                body={"newVersion": "2026-10-12.1", "policies": VALID_POLICIES},
                headers={"authorization": "Bearer clearclass-hackathon-2026-admin"},
            ),
            self.s3, self.bucket
        )
        self.assertEqual(res["statusCode"], 200)
        data = json.loads(res["body"])
        self.assertEqual(data["status"], "updated")
        self.assertEqual(data["version"], "2026-10-12.1")
        self.assertTrue(data["sha256"])


if __name__ == "__main__":
    unittest.main()
