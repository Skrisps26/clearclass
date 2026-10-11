import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from botocore.exceptions import ClientError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from domain.limits import CounterUnavailable, DailyLimiter, RateLimited


class FakeTable:
    def __init__(self):
        self.hits = {}
        self.fail = False

    def update_item(self, Key, UpdateExpression, ConditionExpression, ExpressionAttributeValues):
        if self.fail:
            raise ClientError({"Error": {"Code": "AccessDeniedException", "Message": "No access"}}, "UpdateItem")
        key = Key["pk"]
        count = self.hits.get(key, 0)
        if count >= ExpressionAttributeValues[":limit"]:
            raise ClientError({"Error": {"Code": "ConditionalCheckFailedException", "Message": "Exceeded"}}, "UpdateItem")
        self.hits[key] = count + 1


class DailyLimiterTests(unittest.TestCase):
    def test_per_client_limit_and_next_day_reset(self):
        table = FakeTable()
        limiter = DailyLimiter(table)
        today = datetime(2026, 10, 10, 10, tzinfo=timezone.utc)
        for _ in range(120):
            limiter.charge("203.0.113.1", today)
        with self.assertRaises(RateLimited):
            limiter.charge("203.0.113.1", today)
        limiter.charge("203.0.113.1", today + timedelta(days=1))
        self.assertTrue(any("2026-10-11" in key for key in table.hits))

    def test_global_limit_and_storage_failure_fail_closed(self):
        table = FakeTable()
        limiter = DailyLimiter(table)
        now = datetime(2026, 10, 10, tzinfo=timezone.utc)
        table.hits["provider#2026-10-10#global"] = 1200
        with self.assertRaises(RateLimited):
            limiter.charge("198.51.100.1", now)
        table.fail = True
        with self.assertRaises(CounterUnavailable):
            limiter.charge("198.51.100.2", now + timedelta(days=1))


if __name__ == "__main__":
    unittest.main()
