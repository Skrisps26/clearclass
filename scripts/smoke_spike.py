"""Exercise the deployed M0 Lambda; pass --model for one billable invocation."""

import argparse
import json

import boto3


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", action="store_true", help="Invoke Bedrock once (billable)")
    args = parser.parse_args()
    session = boto3.Session(profile_name="sai", region_name="ap-southeast-2")
    client = session.client("lambda")
    mode = "model" if args.model else "cedar"
    response = client.invoke(
        FunctionName="clearclass-spike",
        InvocationType="RequestResponse",
        Payload=json.dumps({"mode": mode}).encode(),
    )
    output = json.load(response["Payload"])
    if response.get("FunctionError"):
        raise RuntimeError(f"Lambda {mode} failed: {output}")
    cedar = output["cedar"]
    assert cedar == {
        "validation": "passed",
        "allow": True,
        "forbid": True,
        "defaultDeny": True,
    }, output
    if args.model:
        assert output["modelInvoked"] and output["modelId"] == "amazon.nova-micro-v1:0"
        assert output["answer"].strip(), output
        print("Model response:", output["answer"])
    else:
        assert output["modelInvoked"] is False, output
    print("Verified deployed Cedar/schema and", mode, "path")


if __name__ == "__main__":
    main()
