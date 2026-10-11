"""Validated S3 cache: location identity is part of every forecast key."""

import hashlib
import json
from datetime import datetime, timedelta, timezone

from botocore.exceptions import ClientError
from pydantic import ValidationError

from .models import AirSnapshot, Location


class SnapshotStore:
    def __init__(self, s3, bucket: str):
        self.s3 = s3
        self.bucket = bucket

    def _read(self, key: str) -> dict | None:
        try:
            result = self.s3.get_object(Bucket=self.bucket, Key=key)
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") in {"NoSuchKey", "404"}:
                return None
            raise
        try:
            value = json.loads(result["Body"].read())
        except (ValueError, TypeError):
            return None
        return value if isinstance(value, dict) else None

    def _put(self, key: str, value: dict) -> None:
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode(),
            ContentType="application/json",
        )

    def _location_key(self, location_id: int) -> str:
        return f"locations/v1/{location_id}.json"

    def location(self, location_id: int, max_age: timedelta = timedelta(days=7)) -> Location | None:
        record = self._read(self._location_key(location_id))
        if record is None:
            return None
        try:
            saved = datetime.fromisoformat(record["savedAt"])
            location = Location.model_validate(record["location"])
        except (KeyError, ValueError, ValidationError):
            return None
        if location.id != location_id or datetime.now(timezone.utc) - saved > max_age:
            return None
        return location

    def save_location(self, location: Location) -> None:
        self._put(
            self._location_key(location.id),
            {"savedAt": datetime.now(timezone.utc).isoformat(), "location": location.model_dump(mode="json")},
        )

    def _search_key(self, query: str, lang: str) -> str:
        digest = hashlib.sha256(f"{lang}\0{query.strip().casefold()}".encode()).hexdigest()
        return f"search/v1/{digest}.json"

    def search(self, query: str, lang: str) -> list[Location] | None:
        record = self._read(self._search_key(query, lang))
        if record is None:
            return None
        try:
            saved = datetime.fromisoformat(record["savedAt"])
            locations = [Location.model_validate(row) for row in record["locations"]]
        except (KeyError, ValueError, ValidationError):
            return None
        if datetime.now(timezone.utc) - saved > timedelta(days=1):
            return None
        return locations

    def save_search(self, query: str, lang: str, locations: list[Location]) -> None:
        self._put(
            self._search_key(query, lang),
            {"savedAt": datetime.now(timezone.utc).isoformat(), "locations": [item.model_dump(mode="json") for item in locations]},
        )

    def _air_prefix(self, location: Location) -> str:
        identity = f"{location.id}:{location.latitude:.6f}:{location.longitude:.6f}:{location.timezone}"
        digest = hashlib.sha256(identity.encode()).hexdigest()[:20]
        return f"air/v1/{location.id}/{digest}/cams_global"

    def latest_air(self, location: Location) -> AirSnapshot | None:
        record = self._read(f"{self._air_prefix(location)}/latest.json")
        if record is None:
            return None
        try:
            snapshot = AirSnapshot.model_validate(record)
        except ValidationError:
            return None
        if snapshot.locationId != location.id or snapshot.scenario is not None or snapshot.domain != "cams_global":
            return None
        return snapshot

    def save_air(self, location: Location, snapshot: AirSnapshot) -> None:
        if snapshot.locationId != location.id or snapshot.scenario is not None or snapshot.domain != "cams_global":
            raise ValueError("snapshot does not match live location/domain")
        record = snapshot.model_dump(mode="json")
        prefix = self._air_prefix(location)
        revision = snapshot.fetchedAt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        self._put(f"{prefix}/revisions/{revision}.json", record)
        self._put(f"{prefix}/latest.json", record)
