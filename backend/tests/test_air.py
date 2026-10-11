import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from domain.air import (  # noqa: E402
    AIR_QUALITY_URL,
    GEOCODING_GET_URL,
    GEOCODING_SEARCH_URL,
    GeoProvider,
    ProviderError,
)
from domain.models import Location  # noqa: E402


VALID_LOCATION = {
    "id": 2643743,
    "name": "London",
    "admin1": "England",
    "country": "United Kingdom",
    "country_code": "GB",
    "latitude": 51.5085,
    "longitude": -0.1257,
    "timezone": "Europe/London",
}


def provider_for(handler):
    return GeoProvider(httpx.Client(transport=httpx.MockTransport(handler)))


def validated_london():
    return Location.model_validate({
        **{key: value for key, value in VALID_LOCATION.items() if key != "country_code"},
        "countryCode": VALID_LOCATION["country_code"],
    })

class GeoProviderTests(unittest.TestCase):
    def test_search_returns_ambiguous_results_with_bounded_request(self):
        def handler(request):
            self.assertEqual(str(request.url), f"{GEOCODING_SEARCH_URL}?name=London&count=5&language=en&format=json")
            return httpx.Response(200, json={"results": [VALID_LOCATION, {**VALID_LOCATION, "id": 6058560, "country": "Canada", "country_code": "CA", "admin1": "Ontario", "latitude": 42.9834, "longitude": -81.233}]} )

        results = provider_for(handler).search(" London ", "en")

        self.assertEqual([(item.id, item.country) for item in results], [(2643743, "United Kingdom"), (6058560, "Canada")])

    def test_search_returns_empty_results_without_selecting_a_location(self):
        provider = provider_for(lambda request: httpx.Response(200, json={"results": []}))

        self.assertEqual(provider.search("Nowhere", "hi"), [])

    def test_search_rejects_short_query_and_skips_unusable_suggestions(self):
        provider = provider_for(lambda request: httpx.Response(200, json={
            "results": [{**VALID_LOCATION, "timezone": "Mars/Olympus"}, VALID_LOCATION],
        }))

        with self.assertRaisesRegex(ProviderError, "at least three") as short_query:
            provider.search("ab", "en")
        self.assertEqual(short_query.exception.kind, "invalid")
        self.assertEqual([item.id for item in provider.search("London", "en")], [2643743])

    def test_get_requires_a_matching_usable_location_response(self):
        invalid_responses = {
            "mismatched id": {**VALID_LOCATION, "id": 999},
            "invalid coordinates": {**VALID_LOCATION, "latitude": 91},
            "unknown timezone": {**VALID_LOCATION, "timezone": "Mars/Olympus"},
        }

        for name, response in invalid_responses.items():
            with self.subTest(name=name):
                provider = provider_for(lambda request, response=response: httpx.Response(200, json=response))
                with self.assertRaisesRegex(ProviderError, "invalid location data") as invalid_response:
                    provider.get(2643743)
                self.assertEqual(invalid_response.exception.kind, "invalid")

        valid = provider_for(lambda request: httpx.Response(200, json=VALID_LOCATION)).get(2643743)
        self.assertEqual(valid, validated_london())

        provider = provider_for(lambda request: httpx.Response(200, json=VALID_LOCATION))
        with self.assertRaisesRegex(ProviderError, "positive integer") as invalid_id:
            provider.get(True)
        self.assertEqual(invalid_id.exception.kind, "invalid")

    def test_forecast_normalizes_valid_cams_global_response(self):
        def handler(request):
            self.assertEqual(request.url.path, "/v1/air-quality")
            self.assertEqual(
                dict(request.url.params),
                {
                    "latitude": "51.5085",
                    "longitude": "-0.1257",
                    "hourly": "pm2_5,pm10,us_aqi",
                    "timezone": "UTC",
                    "timeformat": "unixtime",
                    "domains": "cams_global",
                    "forecast_days": "2",
                },
            )
            return httpx.Response(
                200,
                json={
                    "latitude": 51.5,
                    "longitude": -0.25,
                    "hourly_units": {"time": "unixtime", "pm2_5": "μg/m³", "pm10": "μg/m³", "us_aqi": "USAQI"},
                    "hourly": {"time": [1_728_000_000, 1_728_003_600], "pm2_5": [11.5, 12], "pm10": [20, 21], "us_aqi": [46, 48]},
                },
            )

        snapshot = provider_for(handler).forecast(validated_london())

        self.assertEqual((snapshot.locationId, snapshot.gridLatitude, snapshot.gridLongitude), (2643743, 51.5, -0.25))
        self.assertEqual([item.referenceAqi for item in snapshot.hourly], [46, 48])
        self.assertEqual(snapshot.hourly[0].time.tzname(), "UTC")
        self.assertIn("not official local AQI", snapshot.source)
        self.assertEqual(snapshot.domain, "cams_global")

    def test_forecast_rejects_bad_arrays_negative_values_and_out_of_order_epochs(self):
        cases = {
            "unequal": {"time": [1_728_000_000], "pm2_5": [10, 11], "pm10": [20], "us_aqi": [50]},
            "negative": {"time": [1_728_000_000], "pm2_5": [-1], "pm10": [20], "us_aqi": [50]},
            "out_of_order": {"time": [1_728_003_600, 1_728_000_000], "pm2_5": [10, 11], "pm10": [20, 21], "us_aqi": [50, 51]},
        }
        units = {"time": "unixtime", "pm2_5": "μg/m³", "pm10": "μg/m³", "us_aqi": "USAQI"}
        location = validated_london()

        for name, hourly in cases.items():
            with self.subTest(name=name):
                provider = provider_for(lambda request, hourly=hourly: httpx.Response(200, json={"latitude": 51.5, "longitude": -0.25, "hourly_units": units, "hourly": hourly}))
                with self.assertRaisesRegex(ProviderError, "invalid data") as failure:
                    provider.forecast(location)
                self.assertEqual(failure.exception.kind, "invalid")

    def test_provider_transport_and_status_failures_are_unavailable(self):
        transport_failure = provider_for(lambda request: (_ for _ in ()).throw(httpx.ConnectError("offline", request=request)))
        status_failure = provider_for(lambda request: httpx.Response(503, json={"reason": "maintenance"}))

        with self.assertRaises(ProviderError) as transport_error:
            transport_failure.search("London", "en")
        self.assertEqual(transport_error.exception.kind, "unavailable")

        with self.assertRaises(ProviderError) as status_error:
            status_failure.search("London", "en")
        self.assertEqual(status_error.exception.kind, "unavailable")


if __name__ == "__main__":
    unittest.main()
