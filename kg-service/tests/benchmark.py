"""Performance benchmark for KG service endpoints.

Measures response times for all key operations and reports p50/p95/avg.
Run against local or deployed service.

Usage:
    python -m tests.benchmark                          # local (http://localhost:8000)
    python -m tests.benchmark --url https://education-production-bafa.up.railway.app
    python -m tests.benchmark --verbose                # show individual timings
"""

import argparse
import json
import statistics
import time
from dataclasses import dataclass

import requests

@dataclass
class BenchResult:
    name: str
    times: list[float]
    status_codes: list[int]

    @property
    def avg(self) -> float:
        return statistics.mean(self.times) if self.times else 0

    @property
    def p50(self) -> float:
        return statistics.median(self.times) if self.times else 0

    @property
    def p95(self) -> float:
        if not self.times:
            return 0
        sorted_times = sorted(self.times)
        idx = int(len(sorted_times) * 0.95)
        return sorted_times[min(idx, len(sorted_times) - 1)]

    @property
    def success_rate(self) -> float:
        if not self.status_codes:
            return 0
        return sum(1 for c in self.status_codes if 200 <= c < 300) / len(self.status_codes) * 100


def timed_request(method: str, url: str, **kwargs) -> tuple[float, int, dict | None]:
    """Make a request and return (elapsed_seconds, status_code, json_body)."""
    start = time.perf_counter()
    try:
        resp = requests.request(method, url, timeout=60, **kwargs)
        elapsed = time.perf_counter() - start
        body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else None
        return elapsed, resp.status_code, body
    except Exception as e:
        elapsed = time.perf_counter() - start
        return elapsed, 0, None


def run_benchmark(base_url: str, iterations: int = 3, verbose: bool = False) -> list[BenchResult]:
    results: list[BenchResult] = []

    tests = [
        # Health check (should be instant)
        ("GET /health", "GET", f"{base_url}/health", None),

        # Standards queries — single subject
        ("GET /standards/MI/2/Science", "GET", f"{base_url}/standards/MI/2/Science", None),
        ("GET /standards/MI/4/Math", "GET", f"{base_url}/standards/MI/4/Math", None),
        ("GET /standards/CA/6/Language Arts", "GET", f"{base_url}/standards/CA/6/Language%20Arts", None),
        ("GET /standards/TX/8/Social Studies", "GET", f"{base_url}/standards/TX/8/Social%20Studies", None),

        # Standards queries — combined (all subjects for a grade)
        ("GET /standards/MI/2 (all subjects)", "GET", f"{base_url}/standards/MI/2", None),
        ("GET /standards/CA/6 (all subjects)", "GET", f"{base_url}/standards/CA/6", None),
        ("GET /standards/OH/4 (all subjects, large state)", "GET", f"{base_url}/standards/OH/4", None),

        # Lesson generation (expensive — only 1 iteration)
        ("POST /generate-lesson (Science, nature-based)", "POST", f"{base_url}/generate-lesson", {
            "children": [{"id": "1", "name": "Emma", "grade": "2", "age": 7, "standards_opt_in": True}],
            "interest": "butterflies",
            "subjects": ["Science"],
            "philosophy": "place-nature-based",
            "state": "MI",
        }),
    ]

    for name, method, url, payload in tests:
        # Use fewer iterations for expensive operations
        n = 1 if "generate-lesson" in url else iterations
        bench = BenchResult(name=name, times=[], status_codes=[])

        for i in range(n):
            kwargs = {}
            if payload:
                kwargs["json"] = payload

            elapsed, status, body = timed_request(method, url, **kwargs)
            bench.times.append(elapsed)
            bench.status_codes.append(status)

            if verbose:
                status_str = f"{status}" if 200 <= status < 300 else f"{status} FAIL"
                print(f"  [{status_str}] {name} — {elapsed:.3f}s")

                # Print result size for standards queries
                if body and "standards" in body:
                    count = body.get("count", len(body.get("standards", [])))
                    print(f"         → {count} standards returned")
                elif body and "subjects" in body:
                    total = body.get("total", sum(s.get("count", 0) for s in body["subjects"]))
                    print(f"         → {total} standards across {len(body['subjects'])} subjects")

        results.append(bench)

    return results


def print_report(results: list[BenchResult]) -> None:
    print("\n" + "=" * 80)
    print("PERFORMANCE BENCHMARK REPORT")
    print("=" * 80)
    print(f"\n{'Endpoint':<50} {'Avg':>7} {'P50':>7} {'P95':>7} {'OK%':>6}")
    print("-" * 80)

    for r in results:
        ok = f"{r.success_rate:.0f}%"
        print(f"{r.name:<50} {r.avg:>6.3f}s {r.p50:>6.3f}s {r.p95:>6.3f}s {ok:>6}")

    # Summary
    print("-" * 80)
    standards_single = [r for r in results if "/standards/" in r.name and "all subjects" not in r.name and "generate" not in r.name and "health" not in r.name]
    standards_combined = [r for r in results if "all subjects" in r.name]
    generation = [r for r in results if "generate" in r.name]

    if standards_single:
        avg_single = statistics.mean(r.avg for r in standards_single)
        print(f"\nStandards (single subject) avg: {avg_single:.3f}s")
    if standards_combined:
        avg_combined = statistics.mean(r.avg for r in standards_combined)
        print(f"Standards (all subjects) avg:   {avg_combined:.3f}s")
        if standards_single:
            speedup = (avg_single * 4) / avg_combined
            print(f"Speedup vs 4 sequential calls: {speedup:.1f}x")
    if generation:
        print(f"Lesson generation avg:         {generation[0].avg:.1f}s")

    # Flag slow endpoints
    slow = [r for r in results if r.avg > 2.0 and "generate" not in r.name]
    if slow:
        print("\n⚠ SLOW ENDPOINTS (>2s):")
        for r in slow:
            print(f"  {r.name}: {r.avg:.3f}s avg")


def main():
    parser = argparse.ArgumentParser(description="KG Service Performance Benchmark")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of KG service")
    parser.add_argument("--iterations", "-n", type=int, default=3, help="Iterations per test")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show individual timings")
    parser.add_argument("--no-generate", action="store_true", help="Skip lesson generation test")
    args = parser.parse_args()

    print(f"Benchmarking: {args.url}")
    print(f"Iterations: {args.iterations}")

    # Warm up
    print("\nWarming up...")
    requests.get(f"{args.url}/health", timeout=10)
    requests.get(f"{args.url}/standards/MI/2/Science", timeout=30)
    print("Warm-up done.\n")

    results = run_benchmark(args.url, iterations=args.iterations, verbose=args.verbose)

    if args.no_generate:
        results = [r for r in results if "generate" not in r.name]

    print_report(results)


if __name__ == "__main__":
    main()
