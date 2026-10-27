const mongoose = require("mongoose");

const savedOutfitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    occasion: { type: String, required: true, trim: true, maxlength: 60 },
    itemIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClothingItem",
      required: true,
    }],
  },
  { timestamps: true },
);

savedOutfitSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SavedOutfit", savedOutfitSchema);
