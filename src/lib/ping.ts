export type PingResult = {
  ok: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
};

const RETRY_DELAYS_MS = [250, 500];

export function isUpStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 400;
}

export function isRetryable(result: PingResult): boolean {
  if (result.ok) {
    return false;
  }

  if (result.statusCode !== null) {
    return result.statusCode >= 500;
  }

  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return "request timed out";
    }

    return error.message;
  }

  return "request failed";
}

export async function pingOnce(
  url: string,
  timeoutMs: number,
): Promise<PingResult> {
  if (!/^https?:\/\//i.test(url)) {
    return {
      ok: false,
      statusCode: null,
      responseTimeMs: null,
      error: "URL must be http or https",
    };
  }

  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": "Pulse/0.1 (+https://github.com/Izaher18/pulse)",
      },
    });

    await response.body?.cancel();

    const ok = isUpStatus(response.status);

    return {
      ok,
      statusCode: response.status,
      responseTimeMs: Date.now() - started,
      error: ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      responseTimeMs: Date.now() - started,
      error: errorMessage(error),
    };
  }
}

export async function pingUrl(
  url: string,
  timeoutMs: number,
): Promise<PingResult> {
  let result = await pingOnce(url, timeoutMs);

  for (const delayMs of RETRY_DELAYS_MS) {
    if (!isRetryable(result)) {
      break;
    }

    await sleep(delayMs);
    result = await pingOnce(url, timeoutMs);
  }

  return result;
}
