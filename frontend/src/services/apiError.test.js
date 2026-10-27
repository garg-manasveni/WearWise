import test from "node:test";
import assert from "node:assert/strict";
import { getApiErrorMessage } from "./apiError.js";

test("uses a JSON API error message when available", async () => {
  const message = await getApiErrorMessage(
    new Response(JSON.stringify({ message: "Invalid email or password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
    "Request failed",
  );
  assert.equal(message, "Invalid email or password.");
});

test("explains a non-JSON API route error", async () => {
  const message = await getApiErrorMessage(
    new Response("<html>not found</html>", { status: 404 }),
    "Request failed",
  );
  assert.match(message, /VITE_API_URL.*\/api/);
});

test("explains CORS denial from a non-JSON server response", async () => {
  const message = await getApiErrorMessage(
    new Response("Forbidden", { status: 403 }),
    "Request failed",
  );
  assert.match(message, /CORS allowed-origin/);
});
