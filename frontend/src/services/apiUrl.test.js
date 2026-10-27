import test from "node:test";
import assert from "node:assert/strict";
import { normalizeApiBaseUrl } from "./apiUrl.js";

test("adds the API prefix to a backend origin", () => {
  assert.equal(
    normalizeApiBaseUrl("https://wearwise-vel2.onrender.com"),
    "https://wearwise-vel2.onrender.com/api",
  );
});

test("removes trailing slashes from an already-prefixed API URL", () => {
  assert.equal(
    normalizeApiBaseUrl("https://wearwise-vel2.onrender.com/api///"),
    "https://wearwise-vel2.onrender.com/api",
  );
});

test("uses the local API default for an empty setting", () => {
  assert.equal(normalizeApiBaseUrl(""), "http://localhost:5000/api");
});
