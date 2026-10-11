import hashlib
import io
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.policy import evaluate_reference
from domain.policy_store import PolicyStore, PolicyUnavailable


PACK = Path(__file__).resolve().parents[1] / "policies/packs/reference-school-activity"
PREFIX = "policies/reference-school-activity"


class MemoryObjects:
    def __init__(self, objects):
        self.objects = objects

    def get_object(self, *, Bucket, Key):
        return {"Body": io.BytesIO(self.objects[Key])}


def published_pack():
    manifest = json.loads((PACK / "manifest.json").read_text())
    version = manifest["version"]
    body = json.dumps({
        "manifest": manifest,
        "schema": (PACK / manifest["schema"]).read_text(),
        "policies": (PACK / manifest["policies"]).read_text(),
    }, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()
    digest = hashlib.sha256(body).hexdigest()
    return {
        f"{PREFIX}/revisions/{version}.json": body,
        f"{PREFIX}/current.json": json.dumps({"version": version, "sha256": digest}).encode(),
    }


class PolicyStoreTests(unittest.TestCase):
    def test_verified_revision_authorizes_and_preserves_source_evidence(self):
        store = PolicyStore(MemoryObjects(published_pack()), "test-bucket", refresh_seconds=0)
        decision = evaluate_reference(201, "ordinary", "all_students", policy_pack=store.current())
        self.assertEqual((decision["status"], decision["decision"]), ("evaluated", "modify"))
        self.assertIn("reference-school-activity.forbid-outdoor-very-unhealthy", decision["evaluations"][0]["matchedPolicyIds"])
        self.assertTrue(decision["sources"])

    def test_invalid_edit_retains_last_valid_pack_but_cold_invalid_never_allows(self):
        objects = published_pack()
        remote = MemoryObjects(objects)
        warm = PolicyStore(remote, "test-bucket", refresh_seconds=0)
        original = warm.current()
        objects[f"{PREFIX}/current.json"] = json.dumps({"version": "2026-10-11.2", "sha256": "0" * 64}).encode()
        self.assertIs(warm.current(), original)
        with self.assertRaises(PolicyUnavailable):
            PolicyStore(remote, "test-bucket", refresh_seconds=0).current()

    def test_checksum_mismatch_rejects_cold_pack(self):
        objects = published_pack()
        pointer_key = f"{PREFIX}/current.json"
        pointer = json.loads(objects[pointer_key])
        pointer["sha256"] = "0" * 64
        objects[pointer_key] = json.dumps(pointer).encode()
        with self.assertRaises(PolicyUnavailable):
            PolicyStore(MemoryObjects(objects), "test-bucket").current()


if __name__ == "__main__":
    unittest.main()
