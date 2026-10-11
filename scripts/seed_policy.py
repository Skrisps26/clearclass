"""Publish the checked-in validated reference pack as a versioned S3 revision."""

import hashlib
import json
from pathlib import Path
import sys

import boto3
from botocore.exceptions import ClientError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend/src"))
from domain.policy import validate_reference_pack  # noqa: E402


PACK = ROOT / "backend/policies/packs/reference-school-activity"
PREFIX = "policies/reference-school-activity"


def main():
    validate_reference_pack()
    manifest = json.loads((PACK / "manifest.json").read_text())
    version = manifest["version"]
    document = {
        "manifest": manifest,
        "schema": (PACK / manifest["schema"]).read_text(),
        "policies": (PACK / manifest["policies"]).read_text(),
    }
    body = json.dumps(document, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()
    digest = hashlib.sha256(body).hexdigest()
    session = boto3.Session(profile_name="sai", region_name="ap-southeast-2")
    stack = session.client("cloudformation")
    resources = stack.list_stack_resources(StackName="clearclass")["StackResourceSummaries"]
    bucket = next(item["PhysicalResourceId"] for item in resources if item["LogicalResourceId"] == "SnapshotBucket")
    s3 = session.client("s3")
    key = f"{PREFIX}/revisions/{version}.json"
    try:
        s3.put_object(Bucket=bucket, Key=key, Body=body, ContentType="application/json", IfNoneMatch="*")
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "PreconditionFailed":
            raise
        existing = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        if hashlib.sha256(existing).hexdigest() != digest:
            raise ValueError("published policy version has different contents") from error
    pointer = json.dumps({"version": version, "sha256": digest}, sort_keys=True, separators=(",", ":")).encode()
    current = f"{PREFIX}/current.json"
    try:
        previous = s3.get_object(Bucket=bucket, Key=current)["Body"].read()
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") not in {"NoSuchKey", "404"}:
            raise
        previous = None
    if previous != pointer:
        s3.put_object(Bucket=bucket, Key=current, Body=pointer, ContentType="application/json")
    print("Validated Cedar revision and current pointer:", version, digest, bucket)


if __name__ == "__main__":
    main()
