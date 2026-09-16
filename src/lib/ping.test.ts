import assert from "node:assert/strict";
import { test } from "node:test";
import { isRetryable, isUpStatus, type PingResult } from "./ping";

test("2xx and 3xx count as up", () => {
  assert.equal(isUpStatus(200), true);
  assert.equal(isUpStatus(301), true);
  assert.equal(isUpStatus(404), false);
  assert.equal(isUpStatus(503), false);
});

test("retries timeouts and 5xx, not 4xx", () => {
  const timeout: PingResult = {
    ok: false,
    statusCode: null,
    responseTimeMs: 10,
    error: "request timed out",
  };
  const serverError: PingResult = {
    ok: false,
    statusCode: 503,
    responseTimeMs: 10,
    error: "HTTP 503",
  };
  const notFound: PingResult = {
    ok: false,
    statusCode: 404,
    responseTimeMs: 10,
    error: "HTTP 404",
  };
  const ok: PingResult = {
    ok: true,
    statusCode: 200,
    responseTimeMs: 10,
    error: null,
  };

  assert.equal(isRetryable(timeout), true);
  assert.equal(isRetryable(serverError), true);
  assert.equal(isRetryable(notFound), false);
  assert.equal(isRetryable(ok), false);
});
