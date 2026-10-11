"""DynamoDB storage for complete daily cards with strict cache identity checks.

DynamoDB TTL (`expiresAt`) is intentionally only an eventual cleanup hint.  A
caller decides freshness before using a returned card; this store never treats an
unexpired TTL value as evidence that the card's air or policy data is current.
"""

from __future__ import annotations

import hashlib
from decimal import Decimal
import json
from datetime import UTC, date, datetime, timedelta
from typing import Any, Callable, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .card import DailyCard


_CARD_KEY_PREFIX = "daily-card/v1"
_MAX_CARD_BYTES = 300_000
_DEFAULT_TTL = timedelta(days=7)


def _un_decimal(value: Any) -> Any:
    if isinstance(value, Decimal):
        return int(value) if "." not in str(value) else float(value)
    if isinstance(value, dict):
        return {k: _un_decimal(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_un_decimal(v) for v in value]
    return value


class CardStoreConflict(Exception):
    """A conditional write found a newer record for the same complete identity."""


class _IdentityModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class CachedPlace(_IdentityModel):
    id: int = Field(gt=0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    timezone: str = Field(min_length=1, max_length=100)

    @field_validator("timezone")
    @classmethod
    def known_iana_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as error:
            raise ValueError("timezone must be a known IANA timezone") from error
        return value


class PolicyPackRevision(_IdentityModel):
    """Version and source bytes of one policy pack used for a cached card."""

    packId: str = Field(min_length=1, max_length=160)
    version: str = Field(min_length=1, max_length=160)
    contentSha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class CardCacheIdentity(_IdentityModel):
    """Everything that can change a card's recommendation or translated copy."""

    schoolId: str = Field(min_length=1, max_length=160)
    location: CachedPlace
    localDate: date
    mode: Literal["live", "scenario"]
    scenarioId: str | None = Field(default=None, min_length=1, max_length=120)
    snapshotRevision: str = Field(min_length=1, max_length=200)
    airStatus: Literal["synthetic", "cached", "cached_stale", "modelled", "unavailable"]
    policyPacks: tuple[PolicyPackRevision, ...] = Field(min_length=1, max_length=16)
    configurationRevision: str = Field(min_length=1, max_length=200)

    @model_validator(mode="after")
    def canonical_policy_packs_and_mode(self) -> "CardCacheIdentity":
        if (self.mode == "live") != (self.scenarioId is None):
            raise ValueError("live identities omit scenarioId and scenario identities require it")
        pack_ids = [pack.packId for pack in self.policyPacks]
        if len(pack_ids) != len(set(pack_ids)):
            raise ValueError("policyPacks must not repeat a pack ID")
        ordered = tuple(sorted(self.policyPacks, key=lambda pack: pack.packId))
        if ordered != self.policyPacks:
            raise ValueError("policyPacks must be sorted by packId")
        return self

    @property
    def policy_set_version(self) -> str:
        """Stable public aggregate for the exact pack bytes used in this card."""
        return "|".join(
            f"{pack.packId}@{pack.version}#{pack.contentSha256}" for pack in self.policyPacks
        )

    @property
    def card_key(self) -> str:
        canonical = json.dumps(
            self.model_dump(mode="json"), ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
        digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return f"{_CARD_KEY_PREFIX}/{digest}"


class StoredCard(_IdentityModel):
    identity: CardCacheIdentity
    card: DailyCard
    revision: int = Field(ge=1)
    expiresAt: int = Field(ge=0)


class CardStore:
    """A DynamoDB Table-resource adapter for validated daily-card records.

    The supplied table must use ``cardKey`` as its partition key and implement
    boto3's Table-resource ``get_item`` and ``put_item`` methods.  ``get``
    returns ``None`` for absent or corrupt data, never a card for another place.
    ``put`` creates a record when ``expected_revision`` is omitted; replacement
    requires the caller to pass the revision returned by ``get`` or ``put``.
    """

    def __init__(
        self,
        table: Any,
        *,
        clock: Callable[[], datetime] | None = None,
        default_ttl: timedelta = _DEFAULT_TTL,
    ):
        if default_ttl <= timedelta(0):
            raise ValueError("default_ttl must be positive")
        self.table = table
        self.clock = clock or (lambda: datetime.now(UTC))
        self.default_ttl = default_ttl

    def get(self, identity: CardCacheIdentity) -> StoredCard | None:
        """Read only the exact key and reject malformed or mismatched records."""
        response = self.table.get_item(Key={"cardKey": identity.card_key}, ConsistentRead=True)
        item = response.get("Item")
        if item is None:
            return None
        try:
            if item["cardKey"] != identity.card_key:
                return None
            stored_identity = CardCacheIdentity.model_validate(_un_decimal(item["identity"]))
            if stored_identity != identity or stored_identity.card_key != identity.card_key:
                return None
            card = DailyCard.model_validate(_un_decimal(item["card"]))
            record = StoredCard(
                identity=stored_identity,
                card=card,
                revision=item["revision"],
                expiresAt=item["expiresAt"],
            )
        except (KeyError, TypeError, ValueError):
            return None
        if not self._matches_card(identity, record.card):
            return None
        return record

    def put(
        self,
        identity: CardCacheIdentity,
        card: DailyCard,
        *,
        expected_revision: int | None = None,
        ttl: timedelta | None = None,
    ) -> StoredCard:
        """Conditionally save an exact-identity card and return its new revision."""
        if expected_revision is not None and (
            isinstance(expected_revision, bool)
            or not isinstance(expected_revision, int)
            or expected_revision < 1
        ):
            raise ValueError("expected_revision must be a positive integer")
        if not self._matches_card(identity, card):
            raise ValueError("card does not match its cache identity")
        serialized_card = card.model_dump_json().encode("utf-8")
        if len(serialized_card) > _MAX_CARD_BYTES:
            raise ValueError("card exceeds the bounded DynamoDB payload limit")

        lifetime = self.default_ttl if ttl is None else ttl
        if lifetime <= timedelta(0):
            raise ValueError("ttl must be positive")
        now = self.clock()
        if now.tzinfo is None or now.utcoffset() is None:
            raise ValueError("clock must return a timezone-aware datetime")
        next_revision = 1 if expected_revision is None else expected_revision + 1
        record = StoredCard(
            identity=identity,
            card=card,
            revision=next_revision,
            expiresAt=int((now + lifetime).timestamp()),
        )
        item = {
            "cardKey": identity.card_key,
            "identity": json.loads(identity.model_dump_json(), parse_float=Decimal),
            "card": json.loads(card.model_dump_json(), parse_float=Decimal),
            "revision": record.revision,
            "expiresAt": record.expiresAt,
        }
        request: dict[str, Any] = {"Item": item}
        if expected_revision is None:
            request["ConditionExpression"] = "attribute_not_exists(cardKey)"
        else:
            request["ConditionExpression"] = "revision = :expectedRevision"
            request["ExpressionAttributeValues"] = {":expectedRevision": expected_revision}
        try:
            self.table.put_item(**request)
        except Exception as error:
            if _conditional_conflict(error):
                raise CardStoreConflict("daily card revision changed") from error
            raise
        return record

    @staticmethod
    def _matches_card(identity: CardCacheIdentity, card: DailyCard) -> bool:
        """Verify every response field that has cache-identity semantics."""
        location = card.location
        return (
            card.schoolId == identity.schoolId
            and card.date == identity.localDate
            and card.scenarioId == identity.scenarioId
            and card.policySetVersion == identity.policy_set_version
            and card.air.status == identity.airStatus
            and location.id == identity.location.id
            and location.coordinates.latitude == identity.location.latitude
            and location.coordinates.longitude == identity.location.longitude
            and location.timezone == identity.location.timezone
        )


def _conditional_conflict(error: Exception) -> bool:
    response = getattr(error, "response", None)
    code = response.get("Error", {}).get("Code") if isinstance(response, dict) else None
    return code == "ConditionalCheckFailedException"
