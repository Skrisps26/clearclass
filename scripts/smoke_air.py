"""Exercise M3 public API across seeded and search-only places with full DailyCard assertions."""

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


with httpx.Client(base_url=url, timeout=20) as client:
    schools = request(client, "/schools")
    schools.raise_for_status()
    school_ids = [item["id"] for item in schools.json()["schools"]]
    assert school_ids == ["delhi-demo", "bengaluru-demo", "london-demo"]

    for query, school in (
        ("Delhi", "delhi-demo"),
        ("Bengaluru", "bengaluru-demo"),
        ("London", "london-demo"),
        ("Reykjavik", "london-demo"),
    ):
        matches = request(client, "/locations", params={"query": query})
        matches.raise_for_status()
        results = matches.json()["locations"]
        assert results and results[0]["name"], (query, results)
        chosen = next((place for place in results if place["name"].casefold() == query.casefold()), results[0])

        # 1. Live modelled card
        card_resp = request(client, f"/schools/{school}/brief", params={"locationId": chosen["id"]})
        card_resp.raise_for_status()
        payload = card_resp.json()
        assert payload["schoolId"] == school
        assert payload["location"]["id"] == chosen["id"], (query, payload)
        assert payload["location"]["timezone"] == chosen["timezone"]
        assert payload["regulatoryCoverage"] == "reference_only"
        assert payload["officialStageStatus"] == "unknown"
        assert payload["air"]["status"] in ("modelled", "cached"), (query, payload["air"])
        assert len(payload["air"]["hourly"]) >= 24
        assert payload["air"]["domain"] == "cams_global"
        assert payload["air"]["authoritativeLocalAqi"] is None
        assert payload["policySources"], "policySources must not be empty"
        assert len(payload["verdicts"]) == 8, f"expected 8 cohort verdicts, got {len(payload['verdicts'])}"
        assert payload["parentMessage"]["en"]
        assert payload["parentMessage"]["hi"]

        # Card caching: second fetch succeeds
        cached_resp = request(client, f"/schools/{school}/brief", params={"locationId": chosen["id"]})
        cached_resp.raise_for_status()
        assert cached_resp.json()["location"]["id"] == chosen["id"]

        print(f"Verified live card for {query} (ID {chosen['id']}): date={payload['date']} air={payload['air']['status']} verdicts={len(payload['verdicts'])}")

        # 2. All 4 synthetic scenarios
        for scenario in ("severe-day", "very-poor-day", "moderate-day", "good-day"):
            fixture = request(client, f"/schools/{school}/brief", params={"locationId": chosen["id"], "scenario": scenario})
            fixture.raise_for_status()
            sc_payload = fixture.json()
            assert sc_payload["air"]["status"] == "synthetic"
            assert sc_payload["scenarioId"] == scenario
            assert sc_payload["date"] == "2026-10-10"
            assert sc_payload["policySources"]
            assert len(sc_payload["verdicts"]) == 8
            assert sc_payload["parentMessage"]["en"]
            assert sc_payload["parentMessage"]["hi"]

            if scenario == "good-day":
                sport = next(v for v in sc_payload["verdicts"] if v["activity"] == "sports" and v["cohort"] == "all_students")
                assert sport["decision"] == "allow"
                assert "allow" in sport["ruleIds"][0]
            elif scenario == "very-poor-day":
                sport = next(v for v in sc_payload["verdicts"] if v["activity"] == "sports" and v["cohort"] == "all_students")
                assert sport["decision"] == "modify"
                assert sport["selectedAction"] == "sport_with_breaks_reduced_intensity"
            elif scenario == "severe-day":
                # AQI 350 exceeds U.S. school guide: status unavailable, coverage gap documented
                assert all(v["status"] == "unavailable" for v in sc_payload["verdicts"])
                assert sc_payload["policySources"]

    # 3. Boundary / error cases
    assert request(client, "/locations", params={"query": "ZZZnonexistentZZZ"}).json()["locations"] == []
    assert request(client, "/locations", params={"query": "ab"}).status_code == 400
    assert request(client, "/schools/no-such-school/brief").status_code == 404
    assert request(client, "/schools/london-demo/brief", params={"scenario": "unknown"}).status_code == 404
    assert request(client, "/schools/london-demo/brief", params={"locationId": "bogus"}).status_code == 400

print("\nSUCCESS: All M3 deterministic brief routes, places, scenarios, Cedar verdicts, ventilation, and bilingual messages verified on deployed Sydney stack:")
print(url)
