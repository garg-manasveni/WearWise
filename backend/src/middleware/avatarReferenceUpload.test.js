const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAvatarReference } = require("./avatarReferenceUpload");
const {
  generatePersonalizedAvatar,
  requireAvatarProvider,
} = require("../controllers/avatarController");

function responseDouble() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("avatar reference validation rejects a missing upload", () => {
  const response = responseDouble();
  validateAvatarReference({}, response, () => assert.fail("Should reject a missing upload."));
  assert.equal(response.statusCode, 400);
});

test("avatar reference validation rejects a file with a mismatched signature", () => {
  const response = responseDouble();
  validateAvatarReference({
    file: { mimetype: "image/png", buffer: Buffer.from("not a png") },
  }, response, () => assert.fail("Should reject a file with an invalid signature."));
  assert.equal(response.statusCode, 400);
});

test("avatar reference validation accepts a matching PNG signature", () => {
  let continued = false;
  validateAvatarReference({
    file: {
      mimetype: "image/png",
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    },
  }, responseDouble(), () => { continued = true; });
  assert.equal(continued, true);
});

test("avatar generation requires explicit consent on the backend", async () => {
  const response = responseDouble();
  await generatePersonalizedAvatar({ body: { style: "polished_2d" } }, response, () => {
    assert.fail("Should reject missing consent before contacting the provider.");
  });
  assert.equal(response.statusCode, 400);
  assert.match(response.payload.message, /consent/i);
});

test("provider-unavailable state is explicit when the key is absent", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const response = responseDouble();
  requireAvatarProvider({}, response, () => assert.fail("Should not continue without a provider key."));
  if (originalKey) process.env.OPENAI_API_KEY = originalKey;
  assert.equal(response.statusCode, 503);
  assert.match(response.payload.message, /default illustrated avatar/i);
});
