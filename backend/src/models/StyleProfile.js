const mongoose = require("mongoose");

const styleProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    preferredStyles: { type: [String], default: [] },
    favoriteColors: { type: [String], default: [] },
    avoidedColors: { type: [String], default: [] },
    comfortPreferences: { type: [String], default: [] },
    fitPreference: {
      type: String,
      enum: ["", "relaxed", "regular", "tailored", "oversized"],
      default: "",
    },
    heightCm: { type: Number, min: 80, max: 250, default: null },
    complexionPreference: {
      type: String,
      enum: ["", "fair", "light", "medium", "deep"],
      default: "",
    },
    undertonePreference: {
      type: String,
      enum: ["", "warm", "cool", "neutral", "olive"],
      default: "",
    },
    stylingNotes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StyleProfile", styleProfileSchema);
