"""Protected policy management and Cedar schema validation API."""

import hashlib
import json
import os
import sys

if "/opt" not in sys.path:
    sys.path.insert(0, "/opt")

import boto3
from botocore.exceptions import ClientError
from cedarpy import Schema, validate_policies

from ..domain.policy import _PACK_DIRECTORY, validated_reference_pack
from ..domain.policy_store import PolicyStore, PolicyUnavailable

PREFIX = "policies/reference-school-activity"
ALLOWED_PACKS = {"reference-school-activity"}


def response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
            "access-control-allow-headers": "content-type, authorization",
        },
        "body": json.dumps(body, ensure_ascii=False, separators=(",", ":")),
    }


def handle_policy(event: dict, s3_client=None, bucket: str = "") -> dict:
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    if http_method == "OPTIONS":
        return response(200, {"status": "ok"})

    params = event.get("queryStringParameters") or {}
    pack_id = params.get("packId", "reference-school-activity")
    if pack_id not in ALLOWED_PACKS:
        return response(404, {"error": "Unknown policy pack ID"})

    bucket_name = bucket or os.environ.get("SNAPSHOT_BUCKET", "")
    s3 = s3_client or boto3.Session(region_name="ap-southeast-2").client("s3")
    if http_method == "GET":
        try:
            manifest = None
            schema_text = None
            policies_text = None
            try:
                store = PolicyStore(s3, bucket_name)
                current_pack = store.current()
                manifest = dict(current_pack.manifest)
            except Exception:
                pass

            if manifest is None:
                manifest = json.loads((_PACK_DIRECTORY / "manifest.json").read_text())

            schema_text = (_PACK_DIRECTORY / manifest.get("schema", "schema.cedarschema")).read_text()
            policies_text = (_PACK_DIRECTORY / manifest.get("policies", "policies.cedar")).read_text()

            # If remote revisions exist in S3, read those
            try:
                ptr_data = s3.get_object(Bucket=bucket_name, Key=f"{PREFIX}/current.json")["Body"].read()
                ptr = json.loads(ptr_data)
                ver = ptr.get("version")
                doc_data = s3.get_object(Bucket=bucket_name, Key=f"{PREFIX}/revisions/{ver}.json")["Body"].read()
                doc = json.loads(doc_data)
                manifest = doc.get("manifest", manifest)
                schema_text = doc.get("schema", schema_text)
                policies_text = doc.get("policies", policies_text)
            except Exception:
                pass

            return response(200, {
                "packId": pack_id,
                "version": manifest.get("version"),
                "manifest": manifest,
                "schema": schema_text,
                "policies": policies_text,
            })
        except Exception as error:
            return response(500, {"error": f"Failed to read policy: {str(error)}"})

    if http_method == "POST":
        # Validate policies against schema
        try:
            body = json.loads(event.get("body") or "{}")
            policies_text = body.get("policies", "")
            schema_text = body.get("schema")
            if not schema_text:
                schema_text = (_PACK_DIRECTORY / "schema.cedarschema").read_text()

            schema = Schema.from_str(schema_text)
            validation = validate_policies(policies_text, schema)
            return response(200, {
                "valid": validation.validation_passed,
                "errors": [str(e) for e in getattr(validation, "errors", [])],
            })
        except Exception as error:
            return response(400, {"valid": False, "error": str(error)})

    if http_method == "PUT":
        # Protected update
        headers = event.get("headers") or {}
        auth = headers.get("authorization") or headers.get("Authorization") or ""
        expected_secret = os.environ.get("POLICY_ADMIN_SECRET", "clearclass-hackathon-2026-admin")
        if not auth.startswith("Bearer ") or auth[7:] != expected_secret:
            return response(401, {"error": "Unauthorized: valid Bearer token required to update policy pack"})

        try:
            body = json.loads(event.get("body") or "{}")
            policies_text = body.get("policies", "")
            expected_version = body.get("expectedVersion")
            new_version = body.get("newVersion")
            schema_text = body.get("schema") or (_PACK_DIRECTORY / "schema.cedarschema").read_text()

            if not new_version or not policies_text:
                return response(400, {"error": "newVersion and policies are required"})

            # Cedar validation before save
            schema = Schema.from_str(schema_text)
            validation = validate_policies(policies_text, schema)
            if not validation.validation_passed:
                return response(422, {
                    "error": "Cedar schema validation failed",
                    "errors": [str(e) for e in getattr(validation, "errors", [])],
                })

            # Optimistic concurrency check on current version
            try:
                curr_ptr = json.loads(s3.get_object(Bucket=bucket_name, Key=f"{PREFIX}/current.json")["Body"].read())
                curr_ver = curr_ptr.get("version")
                if expected_version and curr_ver != expected_version:
                    return response(409, {"error": f"Conflict: expected version {expected_version} but found {curr_ver}"})
            except ClientError as e:
                if e.response.get("Error", {}).get("Code") not in ("NoSuchKey", "404"):
                    raise

            # Build and write new revision
            manifest = json.loads((_PACK_DIRECTORY / "manifest.json").read_text())
            manifest["version"] = new_version
            revision_doc = {
                "manifest": manifest,
                "schema": schema_text,
                "policies": policies_text,
            }
            body_bytes = json.dumps(revision_doc, sort_keys=True, separators=(",", ":")).encode("utf-8")
            digest = hashlib.sha256(body_bytes).hexdigest()

            s3.put_object(
                Bucket=bucket_name,
                Key=f"{PREFIX}/revisions/{new_version}.json",
                Body=body_bytes,
                ContentType="application/json",
            )
            s3.put_object(
                Bucket=bucket_name,
                Key=f"{PREFIX}/current.json",
                Body=json.dumps({"version": new_version, "sha256": digest}, separators=(",", ":")).encode("utf-8"),
                ContentType="application/json",
            )

            return response(200, {
                "status": "updated",
                "version": new_version,
                "sha256": digest,
            })
        except Exception as error:
            return response(500, {"error": str(error)})

    return response(405, {"error": "Method not allowed"})


def handler(event: dict, context: object) -> dict:
    return handle_policy(event)
