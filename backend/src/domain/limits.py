"""Atomic daily counters bound provider demand independently of API throttling."""

import hashlib
from datetime import datetime, timedelta, timezone

from botocore.exceptions import ClientError


class RateLimited(Exception):
    pass


class CounterUnavailable(Exception):
    pass


class DailyLimiter:
    def __init__(self, table):
        self.table = table

    def charge(self, source_ip: str, now: datetime | None = None) -> None:
        instant = now or datetime.now(timezone.utc)
        day = instant.date().isoformat()
        client_hash = hashlib.sha256(source_ip.encode()).hexdigest()[:24]
        expires = int((instant + timedelta(days=2)).timestamp())
        for scope, limit in (("global", 1200), (f"ip#{client_hash}", 120)):
            try:
                self.table.update_item(
                    Key={"pk": f"provider#{day}#{scope}"},
                    UpdateExpression="SET hits = if_not_exists(hits, :zero) + :one, expiresAt = :expiry",
                    ConditionExpression="attribute_not_exists(hits) OR hits < :limit",
                    ExpressionAttributeValues={":zero": 0, ":one": 1, ":limit": limit, ":expiry": expires},
                )
            except ClientError as error:
                if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                    raise RateLimited("Daily request limit reached") from error
                raise CounterUnavailable("Counter storage unavailable") from error
