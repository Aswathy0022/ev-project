from __future__ import annotations

import json
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "data" / "app_data.json"


def init_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DB_PATH.exists():
        DB_PATH.write_text(json.dumps({"users": [], "charging_history": []}, indent=2), encoding="utf-8")


def read_db() -> dict:
    init_database()
    return json.loads(DB_PATH.read_text(encoding="utf-8"))


def write_db(data: dict) -> None:
    init_database()
    DB_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def next_id(items: list[dict]) -> int:
    if not items:
        return 1
    return max(int(item["id"]) for item in items) + 1
