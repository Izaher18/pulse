import assert from "node:assert/strict";
import { test } from "node:test";
import { availableSlug, slugify } from "./slug";

test("slugify makes a readable, URL-safe address", () => {
  assert.equal(slugify("api.example.com"), "api-example-com");
  assert.equal(slugify("  Checkout API (EU)  "), "checkout-api-eu");
  assert.equal(slugify("Café Staging"), "cafe-staging");
  assert.equal(slugify("!!!"), "");
});

test("availableSlug suffixes past names that are already taken", async () => {
  const taken = new Set(["acme-api", "acme-api-2"]);
  const isTaken = async (slug: string) => taken.has(slug);

  assert.equal(await availableSlug("Acme API", isTaken), "acme-api-3");
  assert.equal(await availableSlug("Other API", isTaken), "other-api");
});

test("availableSlug still returns something for an unslugifiable name", async () => {
  assert.equal(await availableSlug("!!!", async () => false), "monitor");
});
