import io
import json
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from botocore.exceptions import ClientError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.domain.air import ProviderError
from src.domain.limits import RateLimited
from src.domain.models import Location
from src.domain.scenarios import scenario_snapshot
from src.domain.storage import SnapshotStore
from src.handlers.brief import handle


NOW = datetime(2026, 10, 10, 10, tzinfo=timezone.utc)
DELHI = Location(id=1273294, name="Delhi", admin1="Delhi", country="India", countryCode="IN", latitude=28.6, longitude=77.2, timezone="Asia/Kolkata")
LONDON = Location(id=2643743, name="London", admin1="England", country="United Kingdom", countryCode="GB", latitude=51.5, longitude=-0.1, timezone="Europe/London")


class FakeS3:
    def __init__(self):
        self.objects = {}

    def put_object(self, Bucket, Key, Body, ContentType):
        self.objects[(Bucket, Key)] = Body

    def get_object(self, Bucket, Key):
        try:
            return {"Body": io.BytesIO(self.objects[(Bucket, Key)])}
        except KeyError as error:
            raise ClientError({"Error": {"Code": "NoSuchKey", "Message": "Missing"}}, "GetObject") from error


class FakeProvider:
    def __init__(self):
        self.fail_location = None
        self.forecast_calls = []
        self.places = {DELHI.id: DELHI, LONDON.id: LONDON}

    def get(self, location_id):
        if location_id not in self.places:
            raise ProviderError("not_found", "No such place")
        return self.places[location_id]

    def search(self, query, lang):
        return [LONDON, DELHI] if query.lower() == "london" else []

    def forecast(self, location):
        self.forecast_calls.append(location.id)
        if self.fail_location == location.id:
            raise ProviderError("unavailable", "provider failure")
        source = scenario_snapshot(location, "good-day", NOW.date())
        return source.model_copy(update={"fetchedAt": NOW, "source": "Modelled CAMS Global forecast", "domain": "cams_global", "scenario": None})


class FakeLimiter:
    def __init__(self):
        self.blocked = False
        self.charges = 0

    def charge(self, ip, now):
        self.charges += 1
        if self.blocked:
            raise RateLimited()


def event(route, params=None, school="london-demo"):
    return {"routeKey": route, "pathParameters": {"id": school}, "queryStringParameters": params or {}, "requestContext": {"http": {"sourceIp": "203.0.113.1"}}}


def body(reply):
    return json.loads(reply["body"])


class BriefRouteTests(unittest.TestCase):
    def setUp(self):
        self.provider = FakeProvider()
        self.store = SnapshotStore(FakeS3(), "private-bucket")
        self.limiter = FakeLimiter()

    def call(self, route, params=None, school="london-demo", now=NOW):
        return handle(event(route, params, school), self.provider, self.store, self.limiter, now)

    def test_search_needs_explicit_selection_and_preserves_ambiguity(self):
        reply = self.call("GET /locations", {"query": "London"})
        self.assertEqual(reply["statusCode"], 200)
        self.assertEqual([row["id"] for row in body(reply)["locations"]], [LONDON.id, DELHI.id])
        self.assertEqual(body(self.call("GET /locations", {"query": "none"}))["locations"], [])
        self.assertEqual(self.call("GET /locations", {"query": "ab"})["statusCode"], 400)

    def test_selected_city_does_not_reuse_another_city_cache(self):
        delhi = self.call("GET /schools/{id}/brief", {"locationId": str(DELHI.id)})
        self.assertEqual(body(delhi)["air"]["status"], "modelled")
        self.provider.fail_location = LONDON.id
        london = body(self.call("GET /schools/{id}/brief", {"locationId": str(LONDON.id)}))
        self.assertEqual(london["location"]["id"], LONDON.id)
        self.assertEqual(london["air"]["status"], "unavailable")
        self.assertIsNone(london["dataAsOf"])
        self.assertEqual(london["air"]["hourly"], [])
        self.assertIn("synthetic scenario", london["air"]["message"])

    def test_failed_refresh_returns_same_place_cached_timestamp(self):
        initial = body(self.call("GET /schools/{id}/brief"))
        self.assertEqual(initial["air"]["status"], "modelled")
        self.provider.fail_location = LONDON.id
        refreshed = body(self.call("GET /schools/{id}/brief", now=NOW + timedelta(hours=2)))
        self.assertEqual(refreshed["air"]["status"], "cached_stale")
        self.assertTrue(refreshed["air"]["stale"])
        self.assertEqual(refreshed["dataAsOf"], initial["dataAsOf"])
        self.assertEqual(refreshed["location"]["id"], LONDON.id)
        self.assertEqual(self.provider.forecast_calls, [LONDON.id, LONDON.id])

    def test_scenario_and_unknown_input_are_distinct(self):
        synthetic = body(self.call("GET /schools/{id}/brief", {"scenario": "severe-day"}))
        self.assertEqual(synthetic["air"]["status"], "synthetic")
        self.assertEqual(synthetic["date"], "2026-10-10")
        self.assertIn("Synthetic", synthetic["parentMessage"]["en"])
        self.assertEqual(self.call("GET /schools/{id}/brief", {"scenario": "missing"})["statusCode"], 404)
        self.assertEqual(self.call("GET /schools/{id}/brief", {"locationId": "abc"})["statusCode"], 400)
        self.assertEqual(self.call("GET /schools/{id}/brief", {"locationId": "999999"})["statusCode"], 404)
        self.assertEqual(self.call("GET /schools/{id}/brief", school="missing")["statusCode"], 404)

    def test_counter_denial_precedes_forecast(self):
        self.limiter.blocked = True
        reply = self.call("GET /schools/{id}/brief")
        self.assertEqual(reply["statusCode"], 429)
        self.assertEqual(self.provider.forecast_calls, [])

    def test_same_place_cache_key_includes_coordinates_and_timezone(self):
        london = scenario_snapshot(LONDON, "good-day", NOW.date()).model_copy(update={"scenario": None, "domain": "cams_global", "fetchedAt": NOW})
        self.store.save_air(LONDON, london)
        moved = LONDON.model_copy(update={"longitude": -0.2, "timezone": "Europe/Paris"})
        self.assertIsNone(self.store.latest_air(moved))
        self.assertIsNotNone(self.store.latest_air(LONDON))


if __name__ == "__main__":
    unittest.main()
