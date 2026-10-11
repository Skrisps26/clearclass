"""Build and deploy the M1 brief without re-uploading the unchanged M0 spike.

Run with the local dev environment: .venv/bin/python scripts/deploy_air.py
The existing clearclass stack supplies the already-deployed spike artifact. This
avoids re-uploading a large, unchanged Strands/Cedar bundle on every brief edit.
"""

import hashlib
import os
from pathlib import Path
import subprocess
import zipfile

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import yaml


ROOT = Path(__file__).resolve().parents[1]
REGION = "ap-southeast-2"
PROFILE = "sai"
STACK = "clearclass"


def main():
    python = subprocess.check_output(["uv", "python", "find", "3.12"], text=True).strip()
    env = os.environ.copy()
    env["PATH"] = f"{Path(python).parent}:{env['PATH']}"
    env["SAM_CLI_TELEMETRY"] = "0"
    subprocess.run(
        ["uvx", "--from", "aws-sam-cli", "sam", "build", "--template-file", "infra/template.yaml",
         "--build-dir", ".aws-sam/build", "--region", REGION, "--profile", PROFILE],
        cwd=ROOT, env=env, check=True,
    )

    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    cfn = session.client("cloudformation")
    current = cfn.get_template(StackName=STACK, TemplateStage="Processed")["TemplateBody"]
    if isinstance(current, str):
        current = yaml.safe_load(current)
    code = current["Resources"]["SpikeFunction"]["Properties"]["Code"]
    bucket = code["S3Bucket"]
    spike_uri = f"s3://{bucket}/{code['S3Key']}"
    source = ROOT / ".aws-sam/build/BriefFunction"
    bundle = ROOT / ".aws-sam/brief.zip"
    with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(source.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(source))
    digest = hashlib.sha256(bundle.read_bytes()).hexdigest()
    key = f"clearclass/artifacts/brief-{digest}.zip"
    s3 = session.client("s3", config=Config(retries={"max_attempts": 5, "mode": "standard"}, read_timeout=120))
    try:
        s3.head_object(Bucket=bucket, Key=key)
        print("Reusing existing brief artifact:", key, flush=True)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") not in {"404", "NoSuchKey"}:
            raise
        with bundle.open("rb") as content:
            s3.put_object(Bucket=bucket, Key=key, Body=content)
        print("Uploaded brief artifact:", key, flush=True)

    template = yaml.safe_load((ROOT / ".aws-sam/build/template.yaml").read_text())
    template["Resources"]["SpikeFunction"]["Properties"]["CodeUri"] = spike_uri
    template["Resources"]["BriefFunction"]["Properties"]["CodeUri"] = f"s3://{bucket}/{key}"
    packaged = ROOT / ".aws-sam/packaged.yaml"
    packaged.write_text(yaml.safe_dump(template, sort_keys=False))
    subprocess.run(
        ["uvx", "--from", "aws-sam-cli", "sam", "deploy", "--template-file", str(packaged),
         "--stack-name", STACK, "--s3-bucket", bucket, "--capabilities", "CAPABILITY_IAM",
         "--region", REGION, "--profile", PROFILE, "--no-confirm-changeset",
         "--no-fail-on-empty-changeset"],
        cwd=ROOT, env=env, check=True,
    )


if __name__ == "__main__":
    main()
