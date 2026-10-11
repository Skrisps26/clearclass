#!/usr/bin/env python3
"""Export the frontend validation schema for the daily-card API response."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND / "src"))

from domain.card import DailyCard  # noqa: E402


OUTPUT = BACKEND / "schema" / "daily-card.schema.json"


def main() -> None:
    schema = DailyCard.model_json_schema()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.parent / f"{OUTPUT.name}.tmp"
    temporary.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    temporary.replace(OUTPUT)


if __name__ == "__main__":
    main()
