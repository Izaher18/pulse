import assert from "node:assert/strict";
import { test } from "node:test";
import { fillDays } from "./days";

const now = new Date("2026-09-17T14:05:00Z");

test("fillDays returns one slot per day, oldest first", () => {
  const days = fillDays([], 30, now);

  assert.equal(days.length, 30);
  assert.equal(days[0].day, "2026-08-19");
  assert.equal(days.at(-1)?.day, "2026-09-17");
});

test("fillDays keeps missing days as gaps instead of shifting bars", () => {
  const days = fillDays(
    [
      { day: new Date("2026-09-15T00:00:00Z"), total: 48, ok: 48 },
      { day: new Date("2026-09-17T00:00:00Z"), total: 20, ok: 19 },
    ],
    3,
    now,
  );

  assert.deepEqual(
    days.map((day) => [day.day, day.uptime]),
    [
      ["2026-09-15", 100],
      ["2026-09-16", null],
      ["2026-09-17", 95],
    ],
  );
});

test("a day with checks but none ok is 0%, not a gap", () => {
  const [day] = fillDays(
    [{ day: new Date("2026-09-17T00:00:00Z"), total: 12, ok: 0 }],
    1,
    now,
  );

  assert.equal(day.uptime, 0);
  assert.equal(day.total, 12);
});
