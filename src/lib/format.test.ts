import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDuration, formatUtc } from "./format";

const MINUTE = 60 * 1000;

test("formatDuration reads like an outage length", () => {
  assert.equal(formatDuration(45 * MINUTE), "45m");
  assert.equal(formatDuration(90 * MINUTE), "1h 30m");
  assert.equal(formatDuration(3 * 60 * MINUTE), "3h");
  assert.equal(formatDuration(50 * 60 * MINUTE), "2d 2h");
});

test("a sub-minute outage is not reported as 0m", () => {
  assert.equal(formatDuration(4000), "1m");
});

test("formatUtc is stable regardless of the reader's timezone", () => {
  assert.equal(
    formatUtc(new Date("2026-09-17T14:05:09Z")),
    "2026-09-17 14:05 UTC",
  );
});
