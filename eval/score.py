#!/usr/bin/env python3
"""Custom scorer for World Cup Fantasy project. Measures 5 dimensions."""

import glob
import json
import re
import subprocess
import sys

WEIGHTS = {
    "lint": 0.35,
    "tests": 0.25,
    "type_check": 0.15,
    "observability": 0.15,
    "capability_surface": 0.10,
}


def run(cmd, timeout=120):
    return subprocess.run(
        cmd, capture_output=True, text=True, timeout=timeout
    )


def score_lint():
    r = run(["npm", "run", "lint"])
    output = r.stdout + r.stderr
    errors = len(re.findall(r"^\s*\d+:\d+\s+error\s+", output, re.MULTILINE))
    if errors == 0 and r.returncode == 0:
        return 1.0, f"0 errors"
    return max(0.0, 1.0 - errors * 0.1), f"{errors} error(s)"


def score_tests():
    r = run(["npx", "vitest", "run", "--reporter=json"])
    try:
        data = json.loads(r.stdout)
        total = data.get("numTotalTests", 0)
        passed = data.get("numPassedTests", 0)
        if total == 0:
            return 0.0, "no tests found"
        return passed / total, f"{passed}/{total} passed"
    except (json.JSONDecodeError, KeyError):
        if r.returncode != 0:
            return 0.0, "vitest not configured or failed"
        return 0.0, "could not parse vitest output"


def score_type_check():
    r = run(["npx", "tsc", "--noEmit"])
    if r.returncode == 0:
        return 1.0, "clean"
    errors = len(re.findall(r"error TS\d+", r.stdout + r.stderr))
    return max(0.0, 1.0 - errors * 0.05), f"{errors} type error(s)"


def score_observability():
    src_files = glob.glob("src/**/*.ts", recursive=True) + glob.glob(
        "src/**/*.tsx", recursive=True
    )
    logger_imports = 0
    log_calls = 0
    has_tracing = False
    for path in src_files:
        with open(path) as f:
            content = f.read()
        if re.search(r"import.*(?:pino|logger)", content):
            logger_imports += 1
        log_calls += len(re.findall(r"logger\.\w+\(", content))
        if re.search(r"request.?id|trace.?id|x-request-id", content, re.IGNORECASE):
            has_tracing = True

    score = min(1.0, logger_imports * 0.2 + log_calls * 0.05 + (0.3 if has_tracing else 0.0))
    detail = f"{logger_imports} logger imports, {log_calls} log calls, tracing={'yes' if has_tracing else 'no'}"
    return score, detail


def score_capability_surface():
    pages = glob.glob("src/app/**/page.tsx", recursive=True)
    routes = glob.glob("src/app/api/**/route.ts", recursive=True)
    components = glob.glob("src/components/*.tsx")
    count = len(pages) + len(routes) + len(components)
    score = min(1.0, count / 30.0)
    return score, f"{count} items ({len(pages)} pages, {len(routes)} routes, {len(components)} components)"


SCORERS = {
    "lint": score_lint,
    "tests": score_tests,
    "type_check": score_type_check,
    "observability": score_observability,
    "capability_surface": score_capability_surface,
}


def main():
    results = []
    total = 0.0
    for name, scorer in SCORERS.items():
        try:
            score, detail = scorer()
        except Exception as e:
            score, detail = 0.0, str(e)
        weight = WEIGHTS[name]
        weighted = score * weight
        total += weighted
        results.append(
            {"name": name, "score": round(score, 4), "weight": weight, "detail": detail}
        )
    output = {"total": round(total, 4), "results": results, "passed": total >= 0.5}
    print(json.dumps(output, indent=2))
    sys.exit(0 if output["passed"] else 1)


if __name__ == "__main__":
    main()
