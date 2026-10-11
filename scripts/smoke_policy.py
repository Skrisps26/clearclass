"""Exercise deployed protected policy management API on Sydney stack."""

import time
import boto3
import httpx


session = boto3.Session(profile_name="sai", region_name="ap-southeast-2")
outputs = session.client("cloudformation").describe_stacks(StackName="clearclass")["Stacks"][0]["Outputs"]
url = next(item["OutputValue"] for item in outputs if item["OutputKey"] == "ApiUrl")


def req(client, method, path, **kwargs):
    time.sleep(0.55)
    return client.request(method, path, **kwargs)


with httpx.Client(base_url=url, timeout=20) as client:
    # 1. GET /policy
    print("Testing GET /policy...")
    res_get = req(client, "GET", "/policy", params={"packId": "reference-school-activity"})
    res_get.raise_for_status()
    data_get = res_get.json()
    assert data_get["packId"] == "reference-school-activity"
    assert "permit" in data_get["policies"]
    assert "entity School" in data_get["schema"]
    print("GET /policy verified: version", data_get["version"])

    # 2. POST /policy/validate (valid)
    print("Testing POST /policy/validate (valid)...")
    valid_text = """
    @id("test.permit")
    permit (principal, action == Action::"ordinary_outdoor", resource)
    when { context.aqi >= 0 && context.aqi <= 100 };
    """
    res_val = req(client, "POST", "/policy/validate", json={"policies": valid_text})
    res_val.raise_for_status()
    assert res_val.json()["valid"] is True
    print("POST /policy/validate (valid) verified")

    # 3. POST /policy/validate (invalid syntax)
    print("Testing POST /policy/validate (invalid)...")
    res_inval = req(client, "POST", "/policy/validate", json={"policies": "permit (bad syntax);"})
    assert res_inval.status_code == 200
    assert res_inval.json()["valid"] is False
    assert res_inval.json()["errors"]
    print("POST /policy/validate (invalid) verified")

    # 4. PUT /policy unauthorized
    print("Testing PUT /policy unauthorized...")
    res_unauth = req(client, "PUT", "/policy", json={"newVersion": "999", "policies": valid_text})
    assert res_unauth.status_code == 401
    print("PUT /policy 401 verified")

    # 5. PUT /policy 422 invalid Cedar
    print("Testing PUT /policy 422...")
    res_422 = req(
        client, "PUT", "/policy",
        json={"newVersion": "999", "policies": "bad cedar;"},
        headers={"authorization": "Bearer clearclass-hackathon-2026-admin"}
    )
    assert res_422.status_code == 422
    print("PUT /policy 422 verified")

print("\nSUCCESS: All deployed Policy management API routes and security boundaries verified on Sydney stack:")
print(url)
