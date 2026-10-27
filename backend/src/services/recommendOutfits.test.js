const test = require("node:test");
const assert = require("node:assert/strict");
const { recommendOutfits } = require("./recommendOutfits");

const request = {
  occasion: "college",
  mood: "comfortable",
  style: "casual",
  color: "",
  weather: "",
  comfort: "",
};

function item(id, category, color, extra = {}) {
  return {
    _id: id,
    name: id,
    category,
    color,
    styleTags: ["casual"],
    occasions: ["college"],
    seasons: ["spring"],
    weather: ["mild"],
    comfortNotes: "soft and easy",
    ...extra,
  };
}

test("recommends complete looks using only saved wardrobe items", () => {
  const wardrobe = [
    item("top-1", "tops", "White"),
    item("bottom-1", "bottoms", "Blue"),
    item("shoe-1", "shoes", "White"),
    item("dress-1", "dresses", "Navy"),
    item("shoe-2", "shoes", "Black"),
  ];

  const result = recommendOutfits({ items: wardrobe, request, profile: {} });

  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every((look) =>
    look.items.every((piece) => wardrobe.some((owned) => owned._id === piece._id))));
  assert.ok(result.recommendations.every((look) =>
    look.items.some((piece) => piece.category === "shoes")));
});

test("honours an avoided colour and an anchor item", () => {
  const wardrobe = [
    item("top-1", "tops", "Red"),
    item("top-2", "tops", "White"),
    item("bottom-1", "bottoms", "Blue"),
    item("shoe-1", "shoes", "Black"),
  ];

  const result = recommendOutfits({
    items: wardrobe,
    request: { ...request, anchorItemId: "top-2" },
    profile: { avoidedColors: ["Red"] },
  });

  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every((look) =>
    look.items.some((piece) => piece._id === "top-2")));
  assert.ok(result.recommendations.every((look) =>
    look.items.every((piece) => piece.color !== "Red")));
});

test("returns closest owned pieces and explains a missing essential category", () => {
  const result = recommendOutfits({
    items: [item("top-1", "tops", "White"), item("bottom-1", "bottoms", "Blue")],
    request,
    profile: {},
  });

  assert.equal(result.recommendations.length, 0);
  assert.equal(result.closestOptions.length, 1);
  assert.deepEqual(result.closestOptions[0].missingCategories, ["shoes"]);
  assert.match(result.message, /missing a piece/i);
});

test("does not return suggestions when every available piece uses an avoided colour", () => {
  const result = recommendOutfits({
    items: [
      item("top-1", "tops", "Red"),
      item("bottom-1", "bottoms", "Blue"),
      item("shoe-1", "shoes", "Black"),
    ],
    request,
    profile: { avoidedColors: ["Red", "Blue", "Black"] },
  });

  assert.equal(result.recommendations.length, 0);
  assert.equal(result.closestOptions.length, 0);
  assert.match(result.message, /avoided colours/i);
});

test("an avoided secondary colour also excludes the item", () => {
  const wardrobe = [
    item("top-1", "tops", "White", { secondaryColor: "Red" }),
    item("bottom-1", "bottoms", "Blue"),
    item("shoe-1", "shoes", "Black"),
  ];
  const result = recommendOutfits({
    items: wardrobe,
    request,
    profile: { avoidedColors: ["Red"] },
  });

  assert.equal(result.recommendations.length, 0);
  assert.ok(result.closestOptions.every((look) =>
    look.items.every((piece) => piece._id !== "top-1")));
});
