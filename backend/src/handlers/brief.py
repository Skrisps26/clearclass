"""M1 public API: place selection and explicitly modelled/synthetic air snapshots."""

import json
import os
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import boto3
import httpx
from botocore.exceptions import BotoCoreError, ClientError

from ..domain.air import GeoProvider, ProviderError
from ..domain.limits import CounterUnavailable, DailyLimiter, RateLimited
from ..domain.models import AirSnapshot, Location
from ..domain.scenarios import SCENARIOS, scenario_snapshot
from ..domain.storage import SnapshotStore


SCHOOLS = {
    "delhi-demo": {"id": "delhi-demo", "name": "Fictional Delhi School", "defaultLocationId": 1273294},
    "bengaluru-demo": {"id": "bengaluru-demo", "name": "Fictional Bengaluru School", "defaultLocationId": 1277333},
    "london-demo": {"id": "london-demo", "name": "Fictional London School", "defaultLocationId": 2643743},
}
FIXTURE_DAY = date(2026, 10, 10)


class BadRequest(Exception):
    pass


def response(status: int, body: dict | list) -> dict:
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"},
        "body": json.dumps(body, ensure_ascii=False, separators=(",", ":")),
    }


def _language(params: dict) -> str:
    lang = params.get("lang", "en")
    if lang not in ("en", "hi"):
        raise BadRequest("lang must be en or hi")
    return lang


def _requested_location(params: dict, school: dict) -> int:
    raw = params.get("locationId")
    if raw is None:
        return school["defaultLocationId"]
    if not isinstance(raw, str) or not raw.isascii() or not raw.isdecimal() or len(raw) > 12 or int(raw) < 1:
        raise BadRequest("locationId must be a positive GeoNames ID")
    return int(raw)


def _location(location_id: int, provider: GeoProvider, store: SnapshotStore) -> Location:
    saved = store.location(location_id)
    if saved is not None:
        return saved
    place = provider.get(location_id)
    store.save_location(place)
    return place


def _air(location: Location, scenario: str | None, provider: GeoProvider, store: SnapshotStore, now: datetime):
    if scenario is not None:
        return scenario_snapshot(location, scenario, FIXTURE_DAY), "synthetic"
    cached = store.latest_air(location)
    if cached is not None and cached.fetchedAt > now:
        cached = None
    if cached is not None and timedelta(0) <= now - cached.fetchedAt <= timedelta(minutes=30):
        return cached, "cached"
    try:
        fresh = provider.forecast(location)
    except ProviderError:
        if cached is not None:
            return cached, "cached_stale"
        return None, "unavailable"
    store.save_air(location, fresh)
    return fresh, "modelled"


def _brief(school: dict, location: Location, snapshot: AirSnapshot | None, status: str, now: datetime, scenario: str | None) -> dict:
    local_zone = ZoneInfo(location.timezone)
    local_date = FIXTURE_DAY if scenario else now.astimezone(local_zone).date()
    hours = []
    if snapshot is not None:
        hours = [
            {
                "time": hour.time.isoformat(),
                "localTime": hour.time.astimezone(local_zone).isoformat(),
                "pm25": hour.pm25,
                "pm10": hour.pm10,
                "referenceAqi": hour.referenceAqi,
            }
            for hour in snapshot.hourly
        ]
    aqi_hour = min(snapshot.hourly, key=lambda hour: abs((hour.time - now).total_seconds())) if snapshot else None
    age_minutes = max(0, int((now - snapshot.fetchedAt).total_seconds() / 60)) if snapshot and scenario is None else None
    unavailable = status == "unavailable"
    caveat = "Synthetic scenario, not actual local air." if scenario else "CAMS Global forecast, not a measurement or official local AQI."
    hi_caveat = "यह कृत्रिम उदाहरण है, स्थानीय वायु का माप नहीं।" if scenario else "यह CAMS Global का पूर्वानुमान है, माप या आधिकारिक स्थानीय AQI नहीं।"
    return {
        "schoolId": school["id"],
        "date": local_date.isoformat(),
        "generatedAt": now.isoformat(),
        "dataSource": snapshot.source if snapshot else "unavailable",
        "dataAsOf": snapshot.fetchedAt.isoformat() if snapshot else None,
        "location": location.model_dump(mode="json"),
        "scenarioId": scenario,
        "policySetVersion": None,
        "regulatoryCoverage": "local_status_unknown",
        "officialStage": None,
        "officialStageStatus": "unknown",
        "air": {
            "status": status,
            "referenceAqi": {
                "scheme": "US_AQI",
                "value": aqi_hour.referenceAqi,
                "provider": snapshot.source,
                "modelled": scenario is None,
            } if aqi_hour and aqi_hour.referenceAqi is not None else None,
            "authoritativeLocalAqi": None,
            "grid": {"latitude": snapshot.gridLatitude, "longitude": snapshot.gridLongitude} if snapshot else None,
            "domain": snapshot.domain if snapshot else None,
            "sourceResolution": "CAMS Global source approximately 45 km / 3 hours; API interpolates hourly rows" if snapshot and not scenario else None,
            "ageMinutes": age_minutes,
            "stale": status == "cached_stale" or unavailable,
            "hourly": hours,
            "message": "Air data unavailable for this place. Try a synthetic scenario." if unavailable else caveat,
        },
        "verdicts": [],
        "ventilation": {"status": "unavailable", "reason": "Policy and ventilation not yet evaluated in the air-data slice."},
        "parentMessage": {
            "en": ("Air data unavailable for this place. " if unavailable else caveat + " ") + "School activity guidance is not evaluated yet.",
            "hi": ("इस स्थान के लिए वायु डेटा उपलब्ध नहीं है। " if unavailable else hi_caveat + " ") + "स्कूल गतिविधि संबंधी सलाह का मूल्यांकन अभी नहीं हुआ है।",
        },
    }


def handle(event: dict, provider: GeoProvider, store: SnapshotStore, limiter: DailyLimiter, now: datetime | None = None) -> dict:
    """Dependency-injected request path, including validation and safe failure states."""
    instant = now or datetime.now(timezone.utc)
    params = event.get("queryStringParameters") or {}
    route = event.get("routeKey")
    try:
        lang = _language(params)
        if route == "GET /schools":
            return response(200, {"schools": list(SCHOOLS.values()), "scenarios": list(SCENARIOS)})
        if route == "GET /locations":
            query = params.get("query", "")
            if not isinstance(query, str) or not 3 <= len(query.strip()) <= 80:
                raise BadRequest("query must be 3–80 characters")
            limiter.charge(event.get("requestContext", {}).get("http", {}).get("sourceIp", "unknown"), instant)
            saved = store.search(query, lang)
            if saved is None:
                saved = provider.search(query, lang)
                store.save_search(query, lang, saved)
            return response(200, {"locations": [place.model_dump(mode="json") for place in saved]})
        if route == "GET /schools/{id}/brief":
            school_id = (event.get("pathParameters") or {}).get("id", "")
            school = SCHOOLS.get(school_id)
            if school is None:
                return response(404, {"error": "Unknown school template"})
            location_id = _requested_location(params, school)
            scenario = params.get("scenario")
            if scenario is not None and scenario not in SCENARIOS:
                return response(404, {"error": "Unknown scenario"})
            limiter.charge(event.get("requestContext", {}).get("http", {}).get("sourceIp", "unknown"), instant)
            location = _location(location_id, provider, store)
            snapshot, status = _air(location, scenario, provider, store, instant)
            return response(200, _brief(school, location, snapshot, status, instant, scenario))
        return response(404, {"error": "Unknown route"})
    except BadRequest as error:
        return response(400, {"error": str(error)})
    except RateLimited:
        return response(429, {"error": "Daily request limit reached. Try again later."})
    except ProviderError as error:
        if error.kind == "not_found":
            return response(404, {"error": "Unknown location"})
        return response(503, {"error": "Place or air provider unavailable. Keep the previous selected place and retry."})
    except (CounterUnavailable, ClientError, BotoCoreError, httpx.HTTPError, ValueError):
        return response(503, {"error": "Data service unavailable. Keep the previous selected place and retry."})


def handler(event: dict, context: object) -> dict:
    client = httpx.Client(timeout=httpx.Timeout(5, connect=2), follow_redirects=False)
    try:
        provider = GeoProvider(client)
        session = boto3.Session(region_name="ap-southeast-2")
        store = SnapshotStore(session.client("s3"), os.environ["SNAPSHOT_BUCKET"])
        limiter = DailyLimiter(session.resource("dynamodb").Table(os.environ["COUNTERS_TABLE"]))
        result = handle(event, provider, store, limiter)
        print(json.dumps({"requestId": getattr(context, "aws_request_id", None), "route": event.get("routeKey"), "status": result["statusCode"]}))
        return result
    finally:
        client.close()
