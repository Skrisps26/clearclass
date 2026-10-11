"""Exercise M1 public API across seeded and search-only places."""

import time

import boto3
import httpx


session = boto3.Session(profile_name="sai", region_name="ap-southeast-2")
outputs = session.client("cloudformation").describe_stacks(StackName="clearclass")["Stacks"][0]["Outputs"]
url = next(item["OutputValue"] for item in outputs if item["OutputKey"] == "ApiUrl")


def request(client, path, **kwargs):
    # Match the production API's 2 requests/second throttle.
    time.sleep(0.55)
    return client.get(path, **kwargs)

with httpx.Client(base_url=url, timeout=15) as client:
    schools = request(client, "/schools")
    schools.raise_for_status()
    assert [item["id"] for item in schools.json()["schools"]] == ["delhi-demo", "bengaluru-demo", "london-demo"]
    for query, school in (("Delhi", "delhi-demo"), ("Bengaluru", "bengaluru-demo"), ("London", "london-demo"), ("Reykjavik", "london-demo")):
        matches = request(client, "/locations", params={"query": query})
        matches.raise_for_status()
        results = matches.json()["locations"]
        assert results and results[0]["name"], (query, results)
        chosen = next((place for place in results if place["name"].casefold() == query.casefold()), results[0])
        card = request(client, f"/schools/{school}/brief", params={"locationId": chosen["id"]})
        card.raise_for_status()
        payload = card.json()
        assert payload["location"]["id"] == chosen["id"], (query, payload)
        assert payload["location"]["timezone"] == chosen["timezone"]
        assert payload["air"]["status"] in ("modelled", "cached"), (query, payload["air"])
        assert len(payload["air"]["hourly"]) >= 24
        assert payload["air"]["domain"] == "cams_global"
        assert payload["air"]["authoritativeLocalAqi"] is None
        print(query, chosen["id"], payload["date"], payload["air"]["status"], payload["air"]["grid"])
        for scenario in ("severe-day", "very-poor-day", "moderate-day", "good-day"):
            fixture = request(client, f"/schools/{school}/brief", params={"locationId": chosen["id"], "scenario": scenario})
            fixture.raise_for_status()
            assert fixture.json()["air"]["status"] == "synthetic"
            assert fixture.json()["air"]["hourly"][0]["localTime"].startswith("2026-10-10")
    assert request(client, "/locations", params={"query": "ZZZnonexistentZZZ"}).json()["locations"] == []
    assert request(client, "/locations", params={"query": "ab"}).status_code == 400
    assert request(client, "/schools/no-such-school/brief").status_code == 404
    assert request(client, "/schools/london-demo/brief", params={"scenario": "unknown"}).status_code == 404
    assert request(client, "/schools/london-demo/brief", params={"locationId": "bogus"}).status_code == 400

print("Verified public M1 routes, seeded/search-only places, scenarios, metadata and error statuses:", url)
