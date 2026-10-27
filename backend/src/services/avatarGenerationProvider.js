const STYLE_PROMPTS = {
  polished_2d: "polished 2D fashion-game illustration with refined linework and expressive features",
  soft_3d: "soft 3D-inspired cartoon character with gentle studio lighting and smooth stylized forms",
  editorial: "editorial fashion illustration with confident proportions, elegant brushwork, and magazine-art direction",
};

class AvatarProviderError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "AvatarProviderError";
    this.status = status;
  }
}

function buildAvatarPrompt(style) {
  const styleDescription = STYLE_PROMPTS[style];
  if (!styleDescription) throw new TypeError("Choose a supported avatar illustration style.");

  return [
    "Create a new, original, full-body stylized digital fashion-game character inspired by the person in the supplied reference photo.",
    `Illustration style: ${styleDescription}.`,
    "Keep recognizable facial characteristics where possible, but interpret them as an illustrated character; do not reproduce the photograph, create a photorealistic face, or paste the original face into the result.",
    "Use a neutral, front-facing standing pose, a simple uncluttered pale background, and a modest plain fitted base outfit suitable for previewing layered clothing.",
    "Show the complete head, torso, arms, legs, and feet. Keep the character centered with space around the body.",
    "The result is a stylized character illustration, not a realistic body, a likeness guarantee, or a claim about clothing fit.",
    "Do not add text, logos, extra people, or accessories.",
  ].join(" ");
}

async function generateAvatar({
  imageBuffer,
  mimeType,
  style,
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_AVATAR_MODEL || "gpt-image-2.5-sunburst",
  fetchImpl = fetch,
}) {
  if (!apiKey) {
    throw new AvatarProviderError("Personalized avatars are unavailable because OPENAI_API_KEY is not configured.", 503);
  }
  if (!Buffer.isBuffer(imageBuffer) || !imageBuffer.length) {
    throw new TypeError("A valid reference image is required.");
  }

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", buildAvatarPrompt(style));
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("output_format", "png");
  form.append("image", new Blob([imageBuffer], { type: mimeType }), `reference.${mimeType.split("/")[1]}`);

  let response;
  try {
    response = await fetchImpl("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new AvatarProviderError("Avatar generation timed out. Try again in a moment.", 504);
    }
    throw new AvatarProviderError("Could not reach the image-generation provider. Check your connection and retry.", 502);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AvatarProviderError("OpenAI rejected the configured API key or account access. Check the key and billing setup.", 503);
    }
    if (response.status === 429) {
      throw new AvatarProviderError("OpenAI is rate-limiting this request or the account has reached its limit. Try later or check billing limits.", 429);
    }
    if (response.status >= 500) {
      throw new AvatarProviderError("OpenAI image generation is temporarily unavailable. Please retry later.", 502);
    }
    throw new AvatarProviderError("OpenAI could not generate this avatar from the selected photo. Try a clear face photo or another illustration style.", 422);
  }

  const encodedImage = payload.data?.[0]?.b64_json;
  if (typeof encodedImage !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedImage)) {
    throw new AvatarProviderError("OpenAI returned an unusable avatar image. Please try again.", 502);
  }

  const imageBufferResult = Buffer.from(encodedImage, "base64");
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    imageBufferResult.length <= pngSignature.length
    || !imageBufferResult.subarray(0, pngSignature.length).equals(pngSignature)
    || imageBufferResult.length > 15 * 1024 * 1024
  ) {
    throw new AvatarProviderError("OpenAI returned an invalid or oversized avatar image.", 502);
  }
  return imageBufferResult;
}

module.exports = { AvatarProviderError, buildAvatarPrompt, generateAvatar };
