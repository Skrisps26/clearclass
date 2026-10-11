import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from domain.messages import render_parent_messages


def verdict(decision="allow", status="evaluated", selected_action="ordinary_outdoor", cohort="all_students"):
    return {
        "activity": "assembly",
        "cohort": cohort,
        "decision": decision,
        "status": status,
        "selectedAction": selected_action,
    }


class ParentMessageTests(unittest.TestCase):
    def test_changes_in_decision_and_data_adequacy_change_both_languages(self):
        allow = render_parent_messages([verdict()], "London", False, "modelled")
        modified = render_parent_messages(
            [verdict("modify", selected_action="ordinary_with_breaks_reduced_intensity")],
            "London", False, "modelled",
        )
        stale = render_parent_messages(
            [verdict("deny", status="stale")], "London", False, "cached_stale"
        )
        for language in ("en", "hi"):
            self.assertEqual(len({allow[language], modified[language], stale[language]}), 3)
        self.assertRegex(allow["hi"], r"[\u0900-\u097F]")
        self.assertNotEqual(allow["hi"], allow["en"])

    def test_indoor_alternative_is_distinct_from_outdoor_breaks(self):
        breaks = render_parent_messages(
            [verdict("modify", selected_action="ordinary_with_breaks_reduced_intensity")],
            "Delhi", True, "synthetic",
        )
        indoors = render_parent_messages(
            [verdict("modify", selected_action="indoor_relocation_or_reschedule")],
            "Delhi", True, "synthetic",
        )
        self.assertNotEqual(breaks["en"], indoors["en"])
        self.assertNotEqual(breaks["hi"], indoors["hi"])
        self.assertEqual(indoors, render_parent_messages(
            [verdict("modify", selected_action="indoor_relocation_or_reschedule")],
            "Delhi", True, "synthetic",
        ))

    def test_duplicate_cohort_action_is_not_repeated_but_sensitive_caveat_is(self):
        general = verdict()
        sensitive = verdict(cohort="sensitive_pupils")
        base = render_parent_messages([general], "Reykjavik", False, "modelled")
        same_action = render_parent_messages([general, sensitive], "Reykjavik", False, "modelled")
        self.assertEqual(base, same_action)
        sensitive["sensitivePupilCaveat"] = "Source-backed caveat"
        with_caveat = render_parent_messages([general, sensitive], "Reykjavik", False, "modelled")
        self.assertNotEqual(base["en"], with_caveat["en"])
        self.assertNotEqual(base["hi"], with_caveat["hi"])


if __name__ == "__main__":
    unittest.main()
