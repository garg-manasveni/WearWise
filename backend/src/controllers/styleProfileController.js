const StyleProfile = require("../models/StyleProfile");

const STYLE_OPTIONS = [
  "Casual", "Classic", "Minimalist", "Elegant", "Streetwear", "Bohemian",
  "Sporty", "Preppy", "Romantic", "Edgy",
];
const COLOR_OPTIONS = [
  "Black", "White", "Ivory", "Beige", "Gray", "Brown", "Navy", "Blue",
  "Lavender", "Pink", "Red", "Green", "Yellow", "Orange", "Purple",
];
const COMFORT_OPTIONS = [
  "Breathable", "Stretchy", "Soft fabrics", "Lightweight", "Room to move", "Layer-friendly",
];
const FIT_OPTIONS = ["", "relaxed", "regular", "tailored", "oversized"];
const COMPLEXION_OPTIONS = ["", "fair", "light", "medium", "deep"];
const UNDERTONE_OPTIONS = ["", "warm", "cool", "neutral", "olive"];

function validList(value, options, maxLength) {
  return Array.isArray(value)
    && value.length <= maxLength
    && value.every((entry) => typeof entry === "string" && options.includes(entry));
}

async function getProfile(request, response, next) {
  try {
    const profile = await StyleProfile.findOne({ userId: request.userId });
    return response.json({ profile });
  } catch (error) {
    return next(error);
  }
}

async function saveProfile(request, response, next) {
  const body = request.body || {};
  const arraysAreValid = validList(body.preferredStyles, STYLE_OPTIONS, 10)
    && validList(body.favoriteColors, COLOR_OPTIONS, COLOR_OPTIONS.length)
    && validList(body.avoidedColors, COLOR_OPTIONS, COLOR_OPTIONS.length)
    && validList(body.comfortPreferences, COMFORT_OPTIONS, COMFORT_OPTIONS.length);
  const fitPreference = body.fitPreference ?? "";
  const heightCm = body.heightCm === "" || body.heightCm === null ? null : Number(body.heightCm);
  const complexionPreference = body.complexionPreference ?? "";
  const undertonePreference = body.undertonePreference ?? "";
  const stylingNotes = typeof body.stylingNotes === "string" ? body.stylingNotes.trim() : "";

  if (!arraysAreValid) return response.status(400).json({ message: "Choose profile preferences from the available options." });
  if (!FIT_OPTIONS.includes(fitPreference)) return response.status(400).json({ message: "Choose a valid preferred fit." });
  if (heightCm !== null && (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250)) {
    return response.status(400).json({ message: "Height must be between 80 and 250 cm, or left blank." });
  }
  if (!COMPLEXION_OPTIONS.includes(complexionPreference) || !UNDERTONE_OPTIONS.includes(undertonePreference)) {
    return response.status(400).json({ message: "Choose an available optional colour preference or leave it blank." });
  }
  if (stylingNotes.length > 500) return response.status(400).json({ message: "Styling notes must be 500 characters or fewer." });

  try {
    const profile = await StyleProfile.findOneAndUpdate(
      { userId: request.userId },
      {
        $set: {
          userId: request.userId,
          preferredStyles: body.preferredStyles,
          favoriteColors: body.favoriteColors,
          avoidedColors: body.avoidedColors,
          comfortPreferences: body.comfortPreferences,
          fitPreference,
          heightCm,
          complexionPreference,
          undertonePreference,
          stylingNotes,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return response.json({ profile });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile, saveProfile };
