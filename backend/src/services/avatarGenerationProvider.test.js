const test = require("node:test");
const assert = require("node:assert/strict");
const { buildAvatarPrompt, generateAvatar, AvatarProviderError } = require("./avatarGenerationProvider");

test("avatar prompts request a new stylized character rather than a pasted photo", () => {
  const prompt = buildAvatarPrompt("polished_2d");
  assert.match(prompt, /new, original, full-body stylized digital fashion-game character/);
  assert.match(prompt, /do not reproduce the photograph/);
  assert.match(prompt, /recognizable facial characteristics/);
});

test("unsupported illustration styles are rejected", () => {
  assert.throws(() => buildAvatarPrompt("photorealistic"), TypeError);
});

test("generation fails clearly when the API key is not configured", async () => {
  await assert.rejects(
    generateAvatar({
      imageBuffer: Buffer.from("reference"),
      mimeType: "image/png",
      style: "polished_2d",
      apiKey: "",
      fetchImpl: async () => {
        throw new Error("The provider should not be called.");
      },
    }),
    (error) => error instanceof AvatarProviderError && error.status === 503,
  );
});

test("generation sends the reference to the image edit endpoint and returns PNG bytes", async () => {
  const image = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.from("generated image"),
  ]);
  let requestUrl;
  let requestOptions;
  const result = await generateAvatar({
    imageBuffer: Buffer.from("face reference"),
    mimeType: "image/jpeg",
    style: "editorial",
    apiKey: "test-key",
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return {
        ok: true,
        json: async () => ({ data: [{ b64_json: image.toString("base64") }] }),
      };
    },
  });

  assert.equal(requestUrl, "https://api.openai.com/v1/images/edits");
  assert.equal(requestOptions.headers.Authorization, "Bearer test-key");
  assert.equal(requestOptions.body.get("model"), process.env.OPENAI_AVATAR_MODEL || "gpt-image-2.5-sunburst");
  assert.equal(requestOptions.body.get("size"), "1024x1536");
  assert.deepEqual(result, image);
});

test("provider rate-limit errors are surfaced with a retryable status", async () => {
  await assert.rejects(
    generateAvatar({
      imageBuffer: Buffer.from("face reference"),
      mimeType: "image/jpeg",
      style: "soft_3d",
      apiKey: "test-key",
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "private provider detail" } }),
      }),
    }),
    (error) => error instanceof AvatarProviderError && error.status === 429 && /rate-limiting/.test(error.message),
  );
});
