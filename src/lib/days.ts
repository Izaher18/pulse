/// One row of a "group checks by day" query.
export type DayCount = {
  day: Date;
  total: number;
  ok: number;
};

export type DayUptime = {
  /// UTC calendar day, as YYYY-MM-DD.
  day: string;
  total: number;
  ok: number;
  uptime: number | null;
};

export function percent(ok: number, total: number): number | null {
  return total === 0 ? null : (ok / total) * 100;
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date, daysAgo = 0): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - daysAgo,
    ),
  );
}

/// Days with no checks are simply absent from a GROUP BY, but the chart needs a
/// slot for each day, otherwise a gap silently shifts every bar after it.
export function fillDays(
  rows: DayCount[],
  days: number,
  now: Date,
): DayUptime[] {
  const byDay = new Map(rows.map((row) => [utcDayKey(row.day), row]));

  return Array.from({ length: days }, (_, index) => {
    const day = utcDayKey(startOfUtcDay(now, days - 1 - index));
    const row = byDay.get(day);

    return {
      day,
      total: row?.total ?? 0,
      ok: row?.ok ?? 0,
      uptime: row ? percent(row.ok, row.total) : null,
    };
  });
}
