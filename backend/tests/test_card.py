import copy
import sys
import unittest
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.card import (
    AirData,
    AirHour,
    CardLocation,
    Coordinates,
    DailyCard,
    ParentMessage,
    ReferenceAqi,
    Ventilation,
)
from domain.card_store import CardCacheIdentity, CardStore, CardStoreConflict, PolicyPackRevision


class ConditionalWriteFailed(Exception):
    response = {"Error": {"Code": "ConditionalCheckFailedException"}}


class MemoryCardTable:
    """Small DynamoDB Table-resource substitute with conditional-write behavior."""

    def __init__(self):
        self.items = {}

    def get_item(self, *, Key, ConsistentRead):
        item = self.items.get(Key["cardKey"])
        return {} if item is None else {"Item": copy.deepcopy(item)}

    def put_item(self, *, Item, ConditionExpression, ExpressionAttributeValues=None):
        existing = self.items.get(Item["cardKey"])
        if ConditionExpression == "attribute_not_exists(cardKey)" and existing is not None:
            raise ConditionalWriteFailed()
        if ConditionExpression == "revision = :expectedRevision" and (
            existing is None or existing["revision"] != ExpressionAttributeValues[":expectedRevision"]
        ):
            raise ConditionalWriteFailed()
        self.items[Item["cardKey"]] = copy.deepcopy(Item)


def identity(*, location_id=1261481, latitude=12.9716, policy_version="2026-10-11.1", config="room-v1", status="modelled"):
    return CardCacheIdentity(
        schoolId="demo-bengaluru",
        location={
            "id": location_id,
            "latitude": latitude,
            "longitude": 77.5946,
            "timezone": "Asia/Kolkata",
        },
        localDate=date(2026, 10, 11),
        mode="live",
        scenarioId=None,
        snapshotRevision="20261011T010000Z",
        airStatus=status,
        policyPacks=[
            PolicyPackRevision(
                packId="reference-school-activity",
                version=policy_version,
                contentSha256="a" * 64,
            )
        ],
        configurationRevision=config,
    )


def card(cache_identity):
    return DailyCard(
        schoolId=cache_identity.schoolId,
        date=cache_identity.localDate,
        generatedAt=datetime(2026, 10, 11, 1, tzinfo=UTC),
        dataSource="Open-Meteo/CAMS Global",
        dataAsOf=datetime(2026, 10, 11, 1, tzinfo=UTC),
        location=CardLocation(
            id=cache_identity.location.id,
            name="Bengaluru",
            coordinates=Coordinates(
                latitude=cache_identity.location.latitude,
                longitude=cache_identity.location.longitude,
            ),
            country="India",
            timezone=cache_identity.location.timezone,
        ),
        scenarioId=cache_identity.scenarioId,
        policySetVersion=cache_identity.policy_set_version,
        regulatoryCoverage="reference_only",
        officialStage=None,
        officialStageStatus="unknown",
        air=AirData(
            status=cache_identity.airStatus,
            referenceAqi=ReferenceAqi(
                scheme="US_AQI",
                value=75,
                provider="Open-Meteo/CAMS Global",
                modelled=True,
            ),
            grid=Coordinates(
                latitude=cache_identity.location.latitude,
                longitude=cache_identity.location.longitude,
            ),
            sourceResolution="CAMS Global forecast",
            ageMinutes=0,
            stale=False,
            hourly=[AirHour(time=datetime(2026, 10, 11, 1, tzinfo=UTC), pm25=20.0, pm10=35.0)],
        ),
        verdicts=[],
        ventilation=Ventilation(
            status="unavailable",
            estimateLabel="Ventilation estimate unavailable; not measured.",
            reason="No room configuration was supplied.",
        ),
        parentMessage=ParentMessage(en="Reference guidance only.", hi="केवल संदर्भ मार्गदर्शन।"),
    )


class CardStoreTests(unittest.TestCase):
    def setUp(self):
        self.table = MemoryCardTable()
        self.store = CardStore(
            self.table,
            clock=lambda: datetime(2026, 10, 11, 2, tzinfo=UTC),
        )

    def test_same_place_identity_hits_its_validated_card(self):
        key = identity()
        saved = self.store.put(key, card(key))

        found = self.store.get(key)

        self.assertIsNotNone(found)
        self.assertEqual(found.revision, saved.revision)
        self.assertEqual(found.card.location.id, 1261481)
        self.assertEqual(found.card.parentMessage.hi, "केवल संदर्भ मार्गदर्शन।")

    def test_cross_place_policy_configuration_and_freshness_identities_do_not_fallback(self):
        original = identity()
        self.store.put(original, card(original))
        alternate_place = identity(location_id=2643743, latitude=51.5072)
        alternate_policy = identity(policy_version="2026-10-12.1")
        alternate_configuration = identity(config="room-v2")
        stale_copy = identity(status="cached_stale")

        self.assertIsNone(self.store.get(alternate_place))
        self.assertIsNone(self.store.get(alternate_policy))
        self.assertIsNone(self.store.get(alternate_configuration))
        self.assertIsNone(self.store.get(stale_copy))

    def test_replacement_requires_the_observed_revision(self):
        key = identity()
        first = self.store.put(key, card(key))
        replacement = self.store.put(key, card(key), expected_revision=first.revision)

        self.assertEqual(replacement.revision, 2)
        with self.assertRaises(CardStoreConflict):
            self.store.put(key, card(key), expected_revision=first.revision)

    def test_corrupt_record_is_rejected_without_returning_another_card(self):
        key = identity()
        self.store.put(key, card(key))
        self.table.items[key.card_key]["card"] = {"schoolId": key.schoolId}

        self.assertIsNone(self.store.get(key))

    def test_ttl_is_cleanup_not_freshness(self):
        key = identity()
        self.store.put(key, card(key), ttl=timedelta(seconds=1))
        self.store.clock = lambda: datetime(2030, 1, 1, tzinfo=UTC)

        found = self.store.get(key)

        self.assertIsNotNone(found)
        self.assertLess(found.expiresAt, int(self.store.clock().timestamp()))


if __name__ == "__main__":
    unittest.main()
