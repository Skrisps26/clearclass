import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.policy import evaluate_reference, validate_reference_pack


class ReferenceSchoolActivityPolicyTests(unittest.TestCase):
    def test_pack_validates_with_schema_and_reference_only_coverage(self):
        pack = validate_reference_pack()

        self.assertEqual(pack["packId"], "reference-school-activity")
        self.assertEqual(pack["expectedAqiScheme"], "US_AQI")
        self.assertEqual(pack["regulatoryCoverage"], "reference_only")
        self.assertFalse(pack["localPolicyOverlay"]["enabled"])
        self.assertEqual(
            pack["localPolicyOverlay"]["status"], "source_verification_required"
        )

    def test_good_moderate_and_usg_boundaries_choose_least_restrictive_activity(self):
        good_sport = evaluate_reference(50, "prolonged_intense_sport", "all_students")
        moderate_sport = evaluate_reference(
            51, "prolonged_intense_sport", "all_students"
        )
        usg_sport = evaluate_reference(101, "prolonged_intense_sport", "all_students")
        usg_ordinary = evaluate_reference(150, "ordinary", "all_students")

        self.assertEqual((good_sport["status"], good_sport["decision"]), ("evaluated", "allow"))
        self.assertEqual(good_sport["selectedAction"], "prolonged_intense_sport")
        self.assertEqual((moderate_sport["status"], moderate_sport["decision"]), ("evaluated", "allow"))
        self.assertEqual(moderate_sport["selectedAction"], "prolonged_intense_sport")
        self.assertEqual((usg_sport["status"], usg_sport["decision"]), ("evaluated", "modify"))
        self.assertEqual(
            usg_sport["selectedAction"], "sport_with_breaks_reduced_intensity"
        )
        self.assertEqual((usg_ordinary["status"], usg_ordinary["decision"]), ("evaluated", "allow"))

    def test_unhealthy_boundaries_and_very_unhealthy_forbid(self):
        unhealthy = evaluate_reference(200, "prolonged_intense_sport", "all_students")
        very_unhealthy = evaluate_reference(201, "ordinary", "all_students")

        self.assertEqual((unhealthy["status"], unhealthy["decision"]), ("evaluated", "modify"))
        self.assertEqual(
            unhealthy["selectedAction"], "sport_with_breaks_reduced_intensity"
        )
        self.assertEqual((very_unhealthy["status"], very_unhealthy["decision"]), ("evaluated", "modify"))
        self.assertEqual(
            very_unhealthy["selectedAction"], "indoor_relocation_or_reschedule"
        )
        self.assertIn(
            "reference-school-activity.forbid-outdoor-very-unhealthy",
            very_unhealthy["evaluations"][0]["matchedPolicyIds"],
        )
        self.assertTrue(very_unhealthy["indoorAirCaveat"])

    def test_values_outside_the_school_guide_are_not_given_a_reference_action(self):
        response = evaluate_reference(301, "ordinary", "all_students")

        self.assertEqual((response["status"], response["decision"]), ("unavailable", "deny"))
        self.assertEqual(response["matchedPolicyIds"], [])

    def test_missing_stale_and_wrong_scheme_withhold_a_recommendation(self):
        missing = evaluate_reference(None, "ordinary", "all_students")
        stale = evaluate_reference(50, "ordinary", "all_students", stale=True)
        wrong_scheme = evaluate_reference(50, "ordinary", "all_students", scheme="CPCB_AQI")

        self.assertEqual((missing["status"], missing["decision"]), ("insufficient_data", "deny"))
        self.assertEqual((stale["status"], stale["decision"]), ("stale", "deny"))
        self.assertEqual(
            (wrong_scheme["status"], wrong_scheme["decision"]),
            ("insufficient_data", "deny"),
        )
        self.assertEqual(wrong_scheme["regulatoryCoverage"], "reference_only")

    def test_unknown_activity_gets_default_deny_without_a_local_law_claim(self):
        response = evaluate_reference(50, "unmapped_activity", "all_students")

        self.assertEqual((response["status"], response["decision"]), ("evaluated", "deny"))
        self.assertEqual(response["matchedPolicyIds"], [])
        self.assertEqual(response["regulatoryCoverage"], "reference_only")


if __name__ == "__main__":
    unittest.main()
