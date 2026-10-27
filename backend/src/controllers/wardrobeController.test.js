const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeFields, validateFields } = require("./wardrobeController");

test("wardrobe photo and name can be saved without optional metadata", () => {
  const fields = normalizeFields({ name: "  Linen shirt  " });

  assert.equal(fields.name, "Linen shirt");
  assert.equal(fields.category, "");
  assert.equal(fields.color, "");
  assert.equal(validateFields(fields), "");
});

test("wardrobe metadata is validated when provided", () => {
  const fields = normalizeFields({ name: "Linen shirt", category: "unknown", color: "Ivory" });

  assert.equal(validateFields(fields), "Choose a valid clothing category.");
});
