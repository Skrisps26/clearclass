import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.domain.chat import create_tools, _deterministic_fallback
from src.domain.models import Location
from src.domain.scenarios import scenario_snapshot
from src.domain.storage import SnapshotStore
from src.handlers.chat import handle_chat
from tests.test_brief import FakeProvider, FakeS3, FakeLimiter, NOW, DELHI, LONDON


class ChatDomainTests(unittest.TestCase):
    def setUp(self):
        self.location = Location(
            id=1273294, name="Delhi", country="India", countryCode="IN",
            latitude=28.6, longitude=77.2, timezone="Asia/Kolkata"
        )
        self.school = {"id": "delhi-demo", "name": "Fictional Delhi School", "defaultLocationId": 1273294}
        self.snapshot = scenario_snapshot(self.location, "very-poor-day", NOW.date())

    def test_tools_return_grounded_json_strings(self):
        tools = create_tools(
            school=self.school,
            location=self.location,
            snapshot=self.snapshot,
            air_status="synthetic",
            local_date="2026-10-10",
            scenario="very-poor-day",
        )
        tool_names = [t.tool_name if hasattr(t, "tool_name") else t.__name__ for t in tools]
        self.assertIn("get_school_profile", tool_names)
        self.assertIn("get_air_quality", tool_names)
        self.assertIn("evaluate_policy", tool_names)
        self.assertIn("plan_ventilation", tool_names)

        # Execute get_school_profile
        profile_fn = next(t for t in tools if (getattr(t, "tool_name", None) or t.__name__) == "get_school_profile")
        profile_res = json.loads(profile_fn())
        self.assertEqual(profile_res["schoolId"], "delhi-demo")
        self.assertEqual(profile_res["location"]["name"], "Delhi")

        # Execute get_air_quality
        air_fn = next(t for t in tools if (getattr(t, "tool_name", None) or t.__name__) == "get_air_quality")
        air_res = json.loads(air_fn())
        self.assertEqual(air_res["status"], "synthetic")
        self.assertEqual(air_res["schoolHourRefAqi"], 200)

        # Execute evaluate_policy
        policy_fn = next(t for t in tools if (getattr(t, "tool_name", None) or t.__name__) == "evaluate_policy")
        sport_res = json.loads(policy_fn(activity="sports", cohort="all_students"))
        self.assertEqual(sport_res["decision"], "modify")
        self.assertTrue(sport_res["ruleIds"])

        # Execute plan_ventilation
        vent_fn = next(t for t in tools if (getattr(t, "tool_name", None) or t.__name__) == "plan_ventilation")
        vent_res = json.loads(vent_fn())
        self.assertEqual(vent_res["status"], "estimated")
        self.assertTrue(vent_res["windowsOpenAt"])

    def test_deterministic_fallback_incorporates_air_data_without_hallucinations(self):
        msg = "Can students play football?"
        fallback = _deterministic_fallback(msg, self.location, self.snapshot, "synthetic")
        self.assertIn("Delhi", fallback)
        self.assertIn("200", fallback)
        self.assertIn("EPA AirNow", fallback)


class ChatHandlerTests(unittest.TestCase):
    def setUp(self):
        self.provider = FakeProvider()
        self.store = SnapshotStore(FakeS3(), "test-bucket")
        self.limiter = FakeLimiter()

    def event(self, body=None, school="delhi-demo"):
        return {
            "routeKey": "POST /schools/{id}/chat",
            "pathParameters": {"id": school},
            "body": json.dumps(body) if isinstance(body, dict) else body,
            "requestContext": {"http": {"sourceIp": "198.51.100.1", "method": "POST"}},
        }

    def test_chat_validates_request_body_and_school(self):
        no_body = handle_chat(self.event(None), self.provider, self.store, self.limiter)
        self.assertEqual(no_body["statusCode"], 400)

        empty_msg = handle_chat(self.event({"message": ""}), self.provider, self.store, self.limiter)
        self.assertEqual(empty_msg["statusCode"], 400)

        unknown_school = handle_chat(self.event({"message": "hi"}, school="missing"), self.provider, self.store, self.limiter)
        self.assertEqual(unknown_school["statusCode"], 404)

        unknown_scenario = handle_chat(self.event({"message": "hi", "scenario": "bogus"}), self.provider, self.store, self.limiter)
        self.assertEqual(unknown_scenario["statusCode"], 400)

    def test_chat_succeeds_with_mock_answer_and_bounded_history(self):
        body = {
            "message": "Can students run outdoors?",
            "scenario": "good-day",
            "history": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi"},
            ],
        }
        res = handle_chat(
            self.event(body),
            self.provider,
            self.store,
            self.limiter,
            mock_answer="Outdoor sports are allowed today under reference guidelines.",
        )
        self.assertEqual(res["statusCode"], 200)
        data = json.loads(res["body"])
        self.assertIn("allowed", data["reply"])
        self.assertEqual(data["schoolId"], "delhi-demo")
        self.assertEqual(data["scenario"], "good-day")

    def test_rate_limiting_denies_chat_before_model_invocation(self):
        self.limiter.blocked = True
        res = handle_chat(
            self.event({"message": "hi"}),
            self.provider,
            self.store,
            self.limiter,
            mock_answer="Should not run",
        )
        self.assertEqual(res["statusCode"], 429)


if __name__ == "__main__":
    unittest.main()
