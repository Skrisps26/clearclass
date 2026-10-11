"""Lambda handler for bounded, grounded school air-quality chat."""

import json
import os
import sys
from datetime import date, datetime, timezone

if "/opt" not in sys.path:
    sys.path.insert(0, "/opt")

import boto3
from botocore.exceptions import BotoCoreError, ClientError
import httpx

from ..domain.air import GeoProvider, ProviderError
from ..domain.chat import answer_question
from ..domain.limits import CounterUnavailable, DailyLimiter, RateLimited
from ..domain.models import Location
from ..domain.policy_store import PolicyStore, PolicyUnavailable
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


def response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
        },
        "body": json.dumps(body, ensure_ascii=False, separators=(",", ":")),
    }


def handle_chat(
    event: dict,
    provider: GeoProvider,
    store: SnapshotStore,
    limiter: DailyLimiter,
    now: datetime | None = None,
    *,
    policy_store: PolicyStore | None = None,
    mock_answer: str | None = None,
) -> dict:
    instant = now or datetime.now(timezone.utc)
    route = event.get("routeKey")
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "POST")

    if http_method == "OPTIONS":
        return response(200, {"status": "ok"})

    school_id = (event.get("pathParameters") or {}).get("id", "")
    school = SCHOOLS.get(school_id)
    if school is None:
        return response(404, {"error": "Unknown school profile"})

    try:
        body_raw = event.get("body")
        if not body_raw:
            raise BadRequest("Missing request body")
        body = json.loads(body_raw) if isinstance(body_raw, str) else body_raw
        if not isinstance(body, dict):
            raise BadRequest("Request body must be a JSON object")

        message = body.get("message", "")
        if not isinstance(message, str) or not 1 <= len(message.strip()) <= 1000:
            raise BadRequest("message must be between 1 and 1000 characters")

        location_id = body.get("locationId") or school["defaultLocationId"]
        if not isinstance(location_id, int) or location_id <= 0:
            raise BadRequest("locationId must be a positive integer")

        language = body.get("language", "en")
        if language not in ("en", "hi"):
            raise BadRequest("language must be en or hi")

        scenario = body.get("scenario")
        if scenario is not None and scenario not in SCENARIOS:
            raise BadRequest("Unknown scenario")

        raw_history = body.get("history") or []
        history = []
        if isinstance(raw_history, list):
            for turn in raw_history[-6:]:
                if isinstance(turn, dict) and "role" in turn and "content" in turn:
                    history.append({"role": str(turn["role"]), "content": str(turn["content"])[:1000]})

        # Charge daily rate limit
        source_ip = event.get("requestContext", {}).get("http", {}).get("sourceIp", "unknown")
        limiter.charge(source_ip, instant)

        # Resolve location
        location = store.location(location_id)
        if location is None:
            location = provider.get(location_id)
            store.save_location(location)

        # Resolve air
        if scenario is not None:
            snapshot = scenario_snapshot(location, scenario, FIXTURE_DAY)
            air_status = "synthetic"
        else:
            cached = store.latest_air(location)
            if cached and (instant - cached.fetchedAt).total_seconds() < 1800:
                snapshot = cached
                air_status = "cached"
            else:
                try:
                    snapshot = provider.forecast(location)
                    store.save_air(location, snapshot)
                    air_status = "modelled"
                except ProviderError:
                    snapshot = cached
                    air_status = "cached_stale" if cached else "unavailable"

        # Resolve policy
        policy_pack = policy_store.current() if policy_store else None

        local_date = FIXTURE_DAY.isoformat() if scenario else instant.date().isoformat()

        if mock_answer is not None:
            reply_data = {"reply": mock_answer, "modelId": "mock-model", "status": "success"}
        else:
            reply_data = answer_question(
                message=message.strip(),
                school=school,
                location=location,
                snapshot=snapshot,
                air_status=air_status,
                local_date=local_date,
                scenario=scenario,
                history=history,
                policy_pack=policy_pack,
            )

        return response(200, {
            "reply": reply_data["reply"],
            "language": language,
            "schoolId": school_id,
            "locationId": location.id,
            "scenario": scenario,
            "modelId": reply_data["modelId"],
            "status": reply_data.get("status", "success"),
        })

    except BadRequest as error:
        return response(400, {"error": str(error)})
    except RateLimited:
        return response(429, {"error": "Daily request limit reached. Try again later."})
    except ProviderError:
        return response(503, {"error": "Air quality provider unavailable."})
    except (CounterUnavailable, ClientError, BotoCoreError, httpx.HTTPError, ValueError):
        return response(503, {"error": "Service unavailable."})


def handler(event: dict, context: object) -> dict:
    client = httpx.Client(timeout=httpx.Timeout(5, connect=2), follow_redirects=False)
    try:
        provider = GeoProvider(client)
        session = boto3.Session(region_name="ap-southeast-2")
        s3 = session.client("s3")
        store = SnapshotStore(s3, os.environ["SNAPSHOT_BUCKET"])
        limiter = DailyLimiter(session.resource("dynamodb").Table(os.environ["COUNTERS_TABLE"]))
        policy_store = PolicyStore(s3, os.environ["SNAPSHOT_BUCKET"])
        result = handle_chat(
            event,
            provider,
            store,
            limiter,
            policy_store=policy_store,
        )
        return result
    finally:
        client.close()
