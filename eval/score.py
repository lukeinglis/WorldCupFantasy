#!/usr/bin/env python3
"""Eval scorer for World Cup Fantasy project."""

import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(cmd, timeout=120):
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=ROOT, timeout=timeout
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "timeout"
    except FileNotFoundError:
        return 1, "", "command not found"


def score_lint():
    code, _, _ = run(["npm", "run", "lint"])
    return 1.0 if code == 0 else 0.9


def score_typecheck():
    code, _, _ = run(["npx", "tsc", "--noEmit"])
    return 1.0 if code == 0 else 0.0


def score_tests():
    code, stdout, stderr = run(["npx", "vitest", "run", "--reporter=json"])
    if code != 0 and "vitest" in stderr.lower() and "not found" in stderr.lower():
        return None, {"installed": False}

    output = stdout + stderr
    for line in output.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            data = json.loads(line)
            passed = data.get("numPassedTests", 0)
            total = data.get("numTotalTests", 0)
            if total > 0:
                return passed / total, {
                    "passed": passed,
                    "total": total,
                    "failed": data.get("numFailedTests", 0),
                }
        except (json.JSONDecodeError, ValueError):
            continue

    try:
        data = json.loads(output)
        passed = data.get("numPassedTests", 0)
        total = data.get("numTotalTests", 0)
        if total > 0:
            return passed / total, {
                "passed": passed,
                "total": total,
                "failed": data.get("numFailedTests", 0),
            }
    except (json.JSONDecodeError, ValueError):
        pass

    return None, {"installed": True, "parsed": False}


def score_observability():
    src = os.path.join(ROOT, "src")
    pino_imports = 0
    logger_calls = 0
    console_calls = 0

    pino_re = re.compile(r"""(?:import\s+.*\bpino\b|require\s*\(\s*['"]pino['"]\s*\))""")
    logger_re = re.compile(r"""\blogger\.\w+\(""")
    console_re = re.compile(r"""\bconsole\.\w+\(""")

    for pattern in ["**/*.ts", "**/*.tsx"]:
        for filepath in glob.glob(os.path.join(src, pattern), recursive=True):
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except OSError:
                continue
            pino_imports += len(pino_re.findall(content))
            logger_calls += len(logger_re.findall(content))
            console_calls += len(console_re.findall(content))

    has_pino = pino_imports > 0
    score = 1.0 if has_pino else 0.0
    return score, {
        "pino_imports": pino_imports,
        "logger_calls": logger_calls,
        "console_calls": console_calls,
        "has_structured_logging": has_pino,
    }


def score_capability_surface():
    src = os.path.join(ROOT, "src")
    target = 30

    pages = glob.glob(os.path.join(src, "app", "**", "page.tsx"), recursive=True)
    routes = glob.glob(os.path.join(src, "app", "api", "**", "route.ts"), recursive=True)
    components = glob.glob(os.path.join(src, "components", "*.tsx"))

    total = len(pages) + len(routes) + len(components)
    score = min(total / target, 1.0) if target > 0 else 0.0

    return score, {
        "pages": len(pages),
        "api_routes": len(routes),
        "components": len(components),
        "total": total,
        "target": target,
    }


def main():
    dimensions = {}
    weights = {
        "lint": 0.15,
        "type_check": 0.20,
        "tests": 0.20,
        "observability": 0.15,
        "capability_surface": 0.30,
    }

    lint = score_lint()
    dimensions["lint"] = {"score": lint, "weight": weights["lint"]}

    tc = score_typecheck()
    dimensions["type_check"] = {"score": tc, "weight": weights["type_check"]}

    test_score, test_details = score_tests()
    if test_score is not None:
        dimensions["tests"] = {
            "score": test_score,
            "weight": weights["tests"],
            "details": test_details,
        }
    else:
        dimensions["tests"] = {
            "score": 0.0,
            "weight": weights["tests"],
            "details": test_details,
            "note": "vitest not installed or no tests found",
        }

    obs_score, obs_details = score_observability()
    dimensions["observability"] = {
        "score": obs_score,
        "weight": weights["observability"],
        "details": obs_details,
    }

    cap_score, cap_details = score_capability_surface()
    dimensions["capability_surface"] = {
        "score": cap_score,
        "weight": weights["capability_surface"],
        "details": cap_details,
    }

    total_weight = sum(
        d["weight"] for d in dimensions.values() if d["score"] is not None
    )
    if total_weight > 0:
        weighted_sum = sum(
            d["score"] * d["weight"]
            for d in dimensions.values()
            if d["score"] is not None
        )
        overall = weighted_sum / total_weight
    else:
        overall = 0.0

    overall = round(overall, 4)

    output = {"score": overall, "dimensions": dimensions}
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
