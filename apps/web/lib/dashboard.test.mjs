import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { formatAppDate, formatDayKey, shiftDayKey, toAppDayKey } from "./dates.ts";

// Resolve the app's TypeScript imports for Node's native test runner.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = { "@/lib/utils": "./utils.ts", "./dates": "./dates.ts" }[specifier];
    return nextResolve(local ? new URL(local, import.meta.url).href : specifier, context);
  },
});
const { getDashboardData } = await import("./dashboard.ts");

function point(id, submittedAt) {
  return {
    id, submittedAt, city: "Salvador", neighborhood: "Itapuã", description: "Teste",
    lat: -12.97, lng: -38.5, heatLevel: "high", shadeLevel: "low",
    issueType: "low_tree_cover", priority: "high", dataOrigin: "simulated",
  };
}

test("nighttime timestamps display and group on the Bahia calendar day", () => {
  const timestamp = "2026-11-08T01:30:00.000Z";
  assert.equal(formatAppDate(timestamp), "07/11/2026");
  assert.equal(toAppDayKey(new Date(timestamp)), "2026-11-07");
  assert.equal(formatDayKey("2026-11-07", true), "07/11/2026");
  const data = getDashboardData({ city: "all", days: "all" }, [point("night", timestamp)], new Date(timestamp));
  assert.deepEqual(data.daily, [{ date: "2026-11-07", count: 1 }]);
  assert.equal(data.recent[0].createdAt, timestamp);
});

test("7 and 30 day periods include the first Bahia midnight and exclude the preceding instant", () => {
  const now = new Date("2026-11-08T01:30:00Z");
  for (const [days, start] of [[7, "2026-11-01"], [30, "2026-10-09"]]) {
    const midnight = Date.parse(`${start}T03:00:00Z`);
    const data = getDashboardData({ city: "all", days }, [
      point("before", new Date(midnight - 1).toISOString()),
      point("start", new Date(midnight).toISOString()),
      point("night", now.toISOString()),
      point("future", "2026-11-08T03:00:00Z"),
    ], now);
    assert.equal(data.totals.approved, 2);
    assert.equal(data.daily.length, days);
    assert.deepEqual(data.daily[0], { date: start, count: 1 });
    assert.deepEqual(data.daily.at(-1), { date: "2026-11-07", count: 1 });
    assert.deepEqual(data.recent.map((item) => item.id), ["night", "start"]);
  }
});

test("calendar keys cross month, year and leap-day boundaries without shifting labels", () => {
  assert.equal(shiftDayKey("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDayKey("2024-03-01", -1), "2024-02-29");
  assert.equal(formatDayKey("2024-02-29"), "29/02");
  const empty = getDashboardData({ city: "all", days: "all" }, [], new Date("2026-11-08T01:30Z"));
  assert.deepEqual(empty.daily, [{ date: "2026-11-07", count: 0 }]);
});
