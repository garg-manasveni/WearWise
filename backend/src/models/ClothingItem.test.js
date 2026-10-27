const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const ClothingItem = require("./ClothingItem");

test("clothing item metadata can remain unclassified after a name and photo upload", async () => {
  const item = new ClothingItem({
    userId: new mongoose.Types.ObjectId(),
    name: "Linen shirt",
    imageKey: "wardrobe-photo.jpg",
  });

  await assert.doesNotReject(item.validate());
  assert.equal(item.category, "");
  assert.equal(item.color, "");
});
