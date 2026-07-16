#!/usr/bin/env python3
"""Smoke-test all RetentionIQ API endpoints."""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request

BASE = "http://localhost:8000"

ENDPOINTS = [
    "/health",
    "/api/meta",
    "/api/overview",
    "/api/funnel",
    "/api/cohorts",
    "/api/features",
    "/api/channels",
    "/api/channels/breakdown",
]


def main() -> int:
    failures = 0
    for path in ENDPOINTS:
        start = time.perf_counter()
        url = f"{BASE}{path}"
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                elapsed_ms = (time.perf_counter() - start) * 1000
                print(f"[OK] {path} → {response.status} ({elapsed_ms:.0f}ms)")
        except urllib.error.HTTPError as error:
            elapsed_ms = (time.perf_counter() - start) * 1000
            failures += 1
            body = error.read().decode()[:120]
            print(f"[FAIL] {path} → {error.code} ({elapsed_ms:.0f}ms) {body}")
        except urllib.error.URLError as error:
            failures += 1
            print(f"[FAIL] {path} → {error.reason}")

    if failures:
        print(f"\n{failures} endpoint(s) failed.")
        return 1

    print("\nAll endpoints OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
