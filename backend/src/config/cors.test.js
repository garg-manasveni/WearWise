const test = require("node:test");
const assert = require("node:assert/strict");
const cors = require("cors");
const express = require("express");
const { createCorsOptions } = require("./cors");

function checkOrigin(options, origin) {
  return new Promise((resolve, reject) => {
    options.origin(origin, (error, allowed) => {
      if (error) return reject(error);
      return resolve(allowed);
    });
  });
}

test("CORS allows the configured frontend origin", async () => {
  const options = createCorsOptions({ CLIENT_ORIGIN: "http://localhost:5173" });

  assert.equal(await checkOrigin(options, "http://localhost:5173"), true);
});

test("CORS allows explicitly listed additional frontend origins", async () => {
  const options = createCorsOptions({
    CLIENT_ORIGIN: "http://localhost:5173",
    CLIENT_ORIGINS: "https://wearwise.example, https://preview.wearwise.example",
  });

  assert.equal(await checkOrigin(options, "https://preview.wearwise.example"), true);
});

test("CORS permits requests without a browser Origin header", async () => {
  const options = createCorsOptions({ CLIENT_ORIGIN: "http://localhost:5173" });

  assert.equal(await checkOrigin(options, undefined), true);
});

test("CORS rejects origins that are not configured", async () => {
  const options = createCorsOptions({ CLIENT_ORIGIN: "http://localhost:5173" });

  await assert.rejects(
    checkOrigin(options, "http://localhost:5174"),
    (error) => error.status === 403,
  );
});

test("Express CORS middleware answers browser preflight requests", async () => {
  const app = express();
  app.use(cors(createCorsOptions({ CLIENT_ORIGIN: "http://localhost:5173" })));
  app.post("/api/auth/login", (request, response) => response.json({ connected: true }));
  app.use((error, request, response, next) => {
    response.status(error.status || 500).json({ message: error.message });
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.match(response.headers.get("access-control-allow-methods"), /POST/);
    assert.match(response.headers.get("access-control-allow-headers"), /authorization/i);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
