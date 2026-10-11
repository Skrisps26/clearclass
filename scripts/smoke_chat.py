"""Exercise deployed Strands chat API on Sydney stack."""

import time
import boto3
import httpx


session = boto3.Session(profile_name="sai", region_name="ap-southeast-2")
outputs = session.client("cloudformation").describe_stacks(StackName="clearclass")["Stacks"][0]["Outputs"]
url = next(item["OutputValue"] for item in outputs if item["OutputKey"] == "ApiUrl")


def post(client, path, body):
    time.sleep(0.6)
    return client.post(path, json=body)


with httpx.Client(base_url=url, timeout=30) as client:
    # 1. English query on Good Day scenario
    print("Testing English query on good-day scenario...")
    res_en = post(
        client,
        "/schools/delhi-demo/chat",
        {
            "message": "Can students do physical education (PE) outside today?",
            "scenario": "good-day",
            "language": "en",
        },
    )
    res_en.raise_for_status()
    data_en = res_en.json()
    assert data_en["reply"], "Reply must not be empty"
    assert data_en["language"] == "en"
    assert data_en["schoolId"] == "delhi-demo"
    assert data_en["scenario"] == "good-day"
    print("English Reply:\n", data_en["reply"][:300])
    print("-" * 50)

    # 2. Hindi query on Very Poor Day scenario
    print("Testing Hindi query on very-poor-day scenario...")
    res_hi = post(
        client,
        "/schools/delhi-demo/chat",
        {
            "message": "क्या आज दोपहर में बच्चे बाहर फुटबॉल खेल सकते हैं?",
            "scenario": "very-poor-day",
            "language": "hi",
        },
    )
    res_hi.raise_for_status()
    data_hi = res_hi.json()
    assert data_hi["reply"], "Hindi reply must not be empty"
    assert data_hi["language"] == "hi"
    print("Hindi Reply:\n", data_hi["reply"][:300])
    print("-" * 50)

    # 3. Boundary & Error validations
    print("Testing error boundaries...")
    assert client.post("/schools/delhi-demo/chat", json={}).status_code == 400
    assert client.post("/schools/delhi-demo/chat", json={"message": ""}).status_code == 400
    assert client.post("/schools/unknown-school/chat", json={"message": "hi"}).status_code == 404
    assert client.post("/schools/delhi-demo/chat", json={"message": "hi", "scenario": "unknown"}).status_code == 400

print("\nSUCCESS: All deployed Chat routes, English/Hindi grounding, and error boundaries verified on Sydney stack:")
print(url)
