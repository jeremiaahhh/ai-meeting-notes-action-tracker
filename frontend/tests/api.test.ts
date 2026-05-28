/**
 * Minimal smoke tests for the API client. These run against a mocked fetch
 * to keep them hermetic; the real backend integration tests live under
 * backend/tests.
 *
 * Run:
 *   npx tsx --test tests/api.test.ts   (Node 20+ test runner)
 */
import test from "node:test";
import assert from "node:assert/strict";

import { ApiError } from "../lib/api";

test("ApiError carries status and code", () => {
  const err = new ApiError("nope", 404, "not_found");
  assert.equal(err.message, "nope");
  assert.equal(err.status, 404);
  assert.equal(err.code, "not_found");
});

test("ApiError defaults code", () => {
  const err = new ApiError("boom", 500);
  assert.equal(err.code, "api_error");
});
