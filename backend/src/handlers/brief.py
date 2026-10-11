"""Place-aware school briefs with sourced Cedar rules and model disclosures."""

import sys
if "/opt" not in sys.path:
    sys.path.insert(0, "/opt")
from datetime import date, datetime, timedelta, timezone
import hashlib
import json
import os
from typing import Any
from zoneinfo import ZoneInfo

import boto3
from botocore.exceptions import BotoCoreError, ClientError
import httpx

from ..domain.advice import school_verdicts
from ..domain.air import GeoProvider, ProviderError
from ..domain.card import DailyCard
from ..domain.card_store import CardCacheIdentity, CachedPlace, CardStore, CardStoreConflict, PolicyPackRevision
from ..domain.limits import CounterUnavailable, DailyLimiter, RateLimited
from ..domain.messages import render_parent_messages
from ..domain.models import AirSnapshot, Location
from ..domain.policy import validate_reference_pack
from ..domain.policy_store import PolicyStore, PolicyUnavailable
from ..domain.scenarios import SCENARIOS, scenario_snapshot
from ..domain.storage import SnapshotStore
from ..domain.ventilation import estimate_ventilation


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


def _verdict_contract(verdicts: list[dict], snapshot: AirSnapshot | None, scenario: str | None) -> list[dict]:
    rows = []
    for verdict in verdicts:
        value = verdict["referenceAqiInput"]
        valid_times = [
            datetime.fromisoformat(instant) if isinstance(instant, str) else instant
            for instant in verdict.get("forecastValidTimes", [])
        ]
        rows.append({
            **{key: item for key, item in verdict.items() if key not in {"matchedPolicyIds", "referenceAqiInput", "forecastValidTimes"}},
            "ruleIds": verdict.get("matchedPolicyIds", []),
            "referenceAqiInput": {
                "scheme": "US_AQI",
                "value": value,
                "provider": snapshot.source,
                "modelled": scenario is None,
            } if value is not None and snapshot is not None else None,
            "forecastValidTimes": valid_times,
            "sourceTime": snapshot.fetchedAt if snapshot else None,
        })
    return rows


def _ventilation_contract(estimate: dict) -> dict:
    if estimate.get("status") != "estimated":
        return estimate
    sources = []
    for index, source in enumerate(estimate.get("assumptions", {}).get("methodSources", [])):
        page_text = source.get("page")
        sources.append({
            "id": f"ventilation-method-{index}",
            "publisher": source.get("issuer"),
            "title": source["title"],
            "url": source["url"],
            "classification": "model_method",
            "pages": page_text[:80] if page_text else None,
            "notes": page_text[:1000] if page_text else None,
        })
    windows = []
    opened_at = None
    last_step_start = None
    for step in estimate.get("steps", []):
        start = datetime.fromisoformat(step["start"]) if isinstance(step["start"], str) else step["start"]
        last_step_start = start
        if step["windowsOpen"] and opened_at is None:
            opened_at = start
        elif not step["windowsOpen"] and opened_at is not None:
            windows.append({"start": opened_at, "end": start})
            opened_at = None
    if opened_at is not None and last_step_start is not None:
        windows.append({"start": opened_at, "end": last_step_start + timedelta(minutes=5)})
    estimate["sources"] = sources
    estimate["flushWindows"] = windows
    estimate["co2Feasible"] = estimate.get("schedule", {}).get("co2Feasible")
    estimate["warnings"] = (
        ["The modeled schedule does not meet the UK reference CO2 indicator; this is not a safety clearance."]
        if not estimate["co2Feasible"]
        else []
    )
    return estimate


def _brief(
    school: dict,
    location: Location,
    snapshot: AirSnapshot | None,
    status: str,
    now: datetime,
    scenario: str | None,
    policy_pack=None,
    policy_sources: list[dict] | None = None,
    *,
    require_remote_policy: bool = False,
    card_policy_version: str | None = None,
) -> DailyCard:
    local_zone = ZoneInfo(location.timezone)
    local_date = FIXTURE_DAY if scenario else now.astimezone(local_zone).date()
    hours = [
        {
            "time": hour.time,
            "localTime": hour.time.astimezone(local_zone),
            "pm25": hour.pm25,
            "pm10": hour.pm10,
            "referenceAqi": hour.referenceAqi,
        }
        for hour in snapshot.hourly
    ] if (snapshot and status != "unavailable") else []

    verdicts, school_air = school_verdicts(
        snapshot,
        location,
        local_date,
        status,
        policy_pack=policy_pack,
        require_remote_policy=require_remote_policy,
    )
    if snapshot is not None and status not in {"cached_stale", "unavailable"}:
        raw_ventilation = estimate_ventilation(
            snapshot, location, local_date, reference_case=True
        )
        ventilation = _ventilation_contract(raw_ventilation)
    else:
        ventilation = {
            "status": "unavailable",
            "reason": "Current selected-place school-hour forecast is unavailable; no comparative window schedule is calculated.",
            "estimateLabel": "Ventilation estimate unavailable; not measured.",
        }
    age_minutes = max(0, int((now - snapshot.fetchedAt).total_seconds() / 60)) if snapshot and scenario is None else None
    caveat = "Synthetic scenario, not actual local air." if scenario else "CAMS Global forecast, not a measurement or official local AQI."

    sources = policy_sources if policy_sources is not None else validate_reference_pack()["sources"]
    card_dict = {
        "schoolId": school["id"],
        "date": local_date,
        "generatedAt": now,
        "dataSource": snapshot.source if snapshot else "unavailable",
        "dataAsOf": snapshot.fetchedAt if snapshot else None,
        "location": {
            "id": location.id,
            "name": location.name,
            "coordinates": {"latitude": location.latitude, "longitude": location.longitude},
            "country": location.country,
            "timezone": location.timezone,
            "admin1": location.admin1,
            "countryCode": location.countryCode,
        },
        "scenarioId": scenario,
        "policySetVersion": card_policy_version or (verdicts[0]["policySetVersion"] if verdicts else None),
        "policySources": sources,
        "regulatoryCoverage": "reference_only",
        "officialStage": None,
        "officialStageStatus": "unknown",
        "air": {
            "status": status,
            "referenceAqi": {
                "scheme": "US_AQI",
                "value": school_air["value"],
                "provider": snapshot.source,
                "modelled": scenario is None,
            } if snapshot and school_air["value"] is not None else None,
            "authoritativeLocalAqi": None,
            "grid": {"latitude": snapshot.gridLatitude, "longitude": snapshot.gridLongitude} if snapshot else None,
            "domain": snapshot.domain if snapshot else None,
            "sourceResolution": "CAMS Global source approximately 45 km / 3 hours; API interpolates hourly rows" if snapshot and not scenario else None,
            "ageMinutes": age_minutes,
            "stale": status in {"cached_stale", "unavailable"},
            "hourly": hours,
            "message": "Air data unavailable for this place. Try a synthetic scenario." if snapshot is None else caveat,
        },
        "verdicts": _verdict_contract(verdicts, snapshot, scenario),
        "ventilation": ventilation,
        "parentMessage": render_parent_messages(verdicts, location.name, bool(scenario), status),
    }
    return DailyCard.model_validate(card_dict)


def _card_identity(
    school_id: str,
    location: Location,
    local_date: date,
    scenario: str | None,
    snapshot: AirSnapshot | None,
    status: str,
    pack_manifest: dict,
    pack_sha256: str,
    config_revision: str,
) -> CardCacheIdentity:
    snapshot_rev = (
        f"{scenario}#{snapshot.fetchedAt.isoformat()}"
        if scenario and snapshot
        else (snapshot.fetchedAt.isoformat() if snapshot else "unavailable")
    )
    return CardCacheIdentity(
        schoolId=school_id,
        location=CachedPlace(
            id=location.id,
            latitude=location.latitude,
            longitude=location.longitude,
            timezone=location.timezone,
        ),
        localDate=local_date,
        mode="scenario" if scenario else "live",
        scenarioId=scenario,
        snapshotRevision=snapshot_rev,
        airStatus=status,
        policyPacks=(
            PolicyPackRevision(
                packId=pack_manifest["packId"],
                version=pack_manifest.get("version") or pack_manifest.get("policySetVersion") or "2026-10-11.1",
                contentSha256=pack_sha256,
            ),
        ),
        configurationRevision=config_revision,
    )


def handle(
    event: dict,
    provider: GeoProvider,
    store: SnapshotStore,
    limiter: DailyLimiter,
    now: datetime | None = None,
    *,
    policy_store: PolicyStore | None = None,
    card_store: CardStore | None = None,
    require_remote_policy: bool = False,
) -> dict:
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

            policy_pack = None
            if policy_store is not None:
                try:
                    policy_pack = policy_store.current()
                except PolicyUnavailable:
                    if require_remote_policy:
                        policy_pack = None
                    else:
                        raise

            pack_manifest = policy_pack.manifest if policy_pack else validate_reference_pack()
            pack_version = pack_manifest.get("version") or pack_manifest.get("policySetVersion") or "2026-10-11.1"
            pack_sha256 = hashlib.sha256(
                f"{pack_version}:{pack_manifest.get('packId', '')}".encode()
            ).hexdigest()
            local_zone = ZoneInfo(location.timezone)
            local_date = FIXTURE_DAY if scenario else instant.astimezone(local_zone).date()
            identity = _card_identity(
                school["id"],
                location,
                local_date,
                scenario,
                snapshot,
                status,
                pack_manifest,
                pack_sha256,
                "m2-2026-10-11",
            )
            if card_store is not None:
                stored = card_store.get(identity)
                if stored is not None:
                    return response(200, stored.card.model_dump(mode="json"))

            card = _brief(
                school,
                location,
                snapshot,
                status,
                instant,
                scenario,
                policy_pack=policy_pack,
                policy_sources=pack_manifest.get("sources"),
                require_remote_policy=require_remote_policy,
                card_policy_version=identity.policy_set_version,
            )
            if card_store is not None:
                try:
                    card_store.put(identity, card)
                except (CardStoreConflict, ClientError):
                    pass
            return response(200, card.model_dump(mode="json"))
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
        s3 = session.client("s3")
        store = SnapshotStore(s3, os.environ["SNAPSHOT_BUCKET"])
        limiter = DailyLimiter(session.resource("dynamodb").Table(os.environ["COUNTERS_TABLE"]))
        policy_store = PolicyStore(s3, os.environ["SNAPSHOT_BUCKET"])
        cards_table_name = os.environ.get("CARDS_TABLE")
        card_store = CardStore(session.resource("dynamodb").Table(cards_table_name)) if cards_table_name else None
        result = handle(
            event,
            provider,
            store,
            limiter,
            policy_store=policy_store,
            card_store=card_store,
        )
        print(json.dumps({
            "requestId": getattr(context, "aws_request_id", None),
            "route": event.get("routeKey"),
            "status": result["statusCode"]
        }))
        return result
    finally:
        client.close()
