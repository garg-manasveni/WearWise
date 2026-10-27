const mongoose = require("mongoose");

const clothingItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: {
      type: String,
      enum: ["", "tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"],
      default: "",
    },
    color: { type: String, trim: true, maxlength: 40, default: "" },
    secondaryColor: { type: String, trim: true, maxlength: 40, default: "" },
    styleTags: { type: [String], default: [] },
    occasions: { type: [String], default: [] },
    seasons: { type: [String], default: [] },
    weather: { type: [String], default: [] },
    comfortNotes: { type: String, trim: true, maxlength: 300, default: "" },
    imageKey: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(document, result) {
        delete result.imageKey;
        return result;
      },
    },
    toObject: { virtuals: true },
  },
);

clothingItemSchema.virtual("imageUrl").get(function getImageUrl() {
  return `/api/wardrobe/${this._id}/image`;
});

clothingItemSchema.index({ userId: 1, category: 1, color: 1 });
clothingItemSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model("ClothingItem", clothingItemSchema);
