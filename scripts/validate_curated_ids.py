#!/usr/bin/env python3
"""
CI Validation script for curated seed IDs in familyContent.js and timelineSeed.js.
Ensures every curated model ID exists in public/data.json.
Fails with exit code 1 if any curated ID is missing.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main() -> int:
    data_path = ROOT / "public" / "data.json"
    family_path = ROOT / "src" / "data" / "familyContent.js"
    timeline_path = ROOT / "src" / "data" / "timelineSeed.js"

    if not data_path.exists():
        print(f"ERROR: {data_path} missing")
        return 1

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_ids = set()
    for c_val in data.get("companies", {}).values():
        for m in c_val.get("models", []):
            if "id" in m:
                all_ids.add(m["id"])
            for alias in m.get("aliases", []):
                all_ids.add(alias)

    errors = []

    # Check familyContent.js
    if family_path.exists():
        content = family_path.read_text(encoding="utf-8")
        matches = re.findall(r"signatureModelIds:\s*\[(.*?)\]", content, re.DOTALL)
        for block in matches:
            ids = [x.strip(" \"'\n\r") for x in block.split(",") if x.strip()]
            for item_id in ids:
                if item_id not in all_ids:
                    errors.append(f"familyContent.js signatureModelId missing in data.json: '{item_id}'")

    # Check timelineSeed.js
    if timeline_path.exists():
        content = timeline_path.read_text(encoding="utf-8")
        keys = re.findall(r'^\s*"([^"]+)":', content, re.MULTILINE)
        for key in keys:
            if key not in all_ids:
                errors.append(f"timelineSeed.js key missing in data.json: '{key}'")

    if errors:
        print("❌ Validation failed! The following curated seed IDs are missing in public/data.json:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("✅ All curated seed IDs in familyContent.js and timelineSeed.js match public/data.json!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
