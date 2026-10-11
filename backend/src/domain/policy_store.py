"""Load a versioned Cedar reference pack from private S3 with last-valid fallback."""

import hashlib
import json
import re
import time
from typing import Any

from .policy import validated_reference_pack


_PREFIX = "policies/reference-school-activity"
_VERSION = re.compile(r"^[0-9][A-Za-z0-9.-]{0,63}$")
_MAX_BYTES = 512_000


class PolicyUnavailable(Exception):
    pass


class PolicyStore:
    def __init__(self, s3: Any, bucket: str, *, refresh_seconds: int = 60):
        self.s3 = s3
        self.bucket = bucket
        self.refresh_seconds = refresh_seconds
        self._last_valid = None
        self._checked_at = float("-inf")

    def _json(self, key: str) -> tuple[dict, bytes]:
        body = self.s3.get_object(Bucket=self.bucket, Key=key)["Body"].read(_MAX_BYTES + 1)
        if len(body) > _MAX_BYTES:
            raise ValueError("policy object exceeds limit")
        parsed = json.loads(body)
        if not isinstance(parsed, dict):
            raise ValueError("policy object must be a JSON object")
        return parsed, body

    def current(self):
        now = time.monotonic()
        if now - self._checked_at < self.refresh_seconds:
            if self._last_valid is None:
                raise PolicyUnavailable("initial reference policy unavailable")
            return self._last_valid
        self._checked_at = now
        try:
            pointer, _ = self._json(f"{_PREFIX}/current.json")
            version = pointer.get("version")
            if not isinstance(version, str) or not _VERSION.fullmatch(version):
                raise ValueError("invalid reference policy version")
            expected_hash = pointer.get("sha256")
            if not isinstance(expected_hash, str) or not re.fullmatch(r"[a-f0-9]{64}", expected_hash):
                raise ValueError("invalid reference policy checksum")
            document, raw = self._json(f"{_PREFIX}/revisions/{version}.json")
            if hashlib.sha256(raw).hexdigest() != expected_hash:
                raise ValueError("policy revision checksum mismatch")
            if document.get("manifest", {}).get("version") != version:
                raise ValueError("policy pointer and manifest version differ")
            pack = validated_reference_pack(
                document["manifest"], document["schema"], document["policies"]
            )
        except Exception as error:
            if self._last_valid is not None:
                return self._last_valid
            raise PolicyUnavailable("initial reference policy unavailable") from error
        self._last_valid = pack
        return pack
