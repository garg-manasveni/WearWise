const mongoose = require("mongoose");
const ClothingItem = require("../models/ClothingItem");
const SavedOutfit = require("../models/SavedOutfit");
const StyleProfile = require("../models/StyleProfile");
const { recommendOutfits } = require("../services/recommendOutfits");

const OCCASIONS = ["college", "casual outing", "birthday", "family function", "interview", "dinner"];
const MOODS = ["comfortable", "confident", "elegant", "playful", "relaxed", "experimental"];
const WEATHER = ["warm", "mild", "cold", "rainy", "spring", "summer", "autumn", "winter"];
const STYLES = [
  "Casual", "Classic", "Minimalist", "Elegant", "Streetwear", "Bohemian",
  "Sporty", "Preppy", "Romantic", "Edgy",
];
const COLORS = [
  "Black", "White", "Ivory", "Beige", "Gray", "Brown", "Navy", "Blue",
  "Lavender", "Pink", "Red", "Green", "Yellow", "Orange", "Purple",
];
const COMFORT = [
  "comfortable", "breathable", "stretchy", "soft fabrics", "lightweight",
  "room to move", "layer-friendly",
];
const MAX_RECENT_DAYS = 365;

function normalizedText(value, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length <= maxLength ? text : "";
}

async function getRecommendations(request, response, next) {
  const body = request.body || {};
  const occasion = normalizedText(body.occasion, 60);
  const mood = normalizedText(body.mood, 30).toLowerCase();
  const style = normalizedText(body.style, 30);
  const color = normalizedText(body.color, 40);
  const weather = normalizedText(body.weather, 20).toLowerCase();
  const comfort = normalizedText(body.comfort, 30).toLowerCase();
  const avoidRecentlyWorn = body.avoidRecentlyWorn === true;
  const includeRecentlyWorn = body.includeRecentlyWorn === true;
  const recentDays = body.recentDays === undefined ? 30 : Number(body.recentDays);

  if ((body.avoidRecentlyWorn !== undefined && typeof body.avoidRecentlyWorn !== "boolean")
    || (body.includeRecentlyWorn !== undefined && typeof body.includeRecentlyWorn !== "boolean")) {
    return response.status(400).json({ message: "Recent-outfit options must be true or false." });
  }
  if (occasion && !OCCASIONS.includes(occasion.toLowerCase()) && occasion.length < 2) {
    return response.status(400).json({ message: "Enter an occasion with at least two characters." });
  }
  if (mood && !MOODS.includes(mood)) return response.status(400).json({ message: "Choose a valid mood." });
  if (style && !STYLES.includes(style)) return response.status(400).json({ message: "Choose a valid style direction." });
  if (color && !COLORS.includes(color)) return response.status(400).json({ message: "Choose a valid colour." });
  if (weather && !WEATHER.includes(weather)) return response.status(400).json({ message: "Choose a valid weather option." });
  if (comfort && !COMFORT.includes(comfort)) return response.status(400).json({ message: "Choose a valid comfort preference." });
  if (!Number.isInteger(recentDays) || recentDays < 1 || recentDays > MAX_RECENT_DAYS) {
    return response.status(400).json({ message: "Choose a recent-use period between 1 and 365 days." });
  }
  if (body.anchorItemId && !mongoose.isValidObjectId(body.anchorItemId)) {
    return response.status(400).json({ message: "Choose a valid wardrobe item to build around." });
  }

  try {
    const recentCutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
    const [items, profile, recentOutfits] = await Promise.all([
      ClothingItem.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(200),
      StyleProfile.findOne({ userId: request.userId }),
      avoidRecentlyWorn && !includeRecentlyWorn
        ? SavedOutfit.find({
          userId: request.userId,
          "wornHistory.wornAt": { $gte: recentCutoff },
        }).select("itemIds wornHistory").lean()
        : [],
    ]);

    if (body.anchorItemId && !items.some((item) => String(item._id) === String(body.anchorItemId))) {
      return response.status(404).json({ message: "That item is not in your wardrobe." });
    }

    const result = recommendOutfits({
      items,
      profile: profile || {},
      recentlyWornItemSets: recentOutfits.map((outfit) => outfit.itemIds.map(String)),
      request: { occasion, mood, style, color, weather, comfort, anchorItemId: body.anchorItemId || "" },
      avoidRecentlyWorn: avoidRecentlyWorn && !includeRecentlyWorn,
    });
    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

async function listSavedOutfits(request, response, next) {
  try {
    const outfits = await SavedOutfit.find({ userId: request.userId })
      .sort({ createdAt: -1 })
      .populate({ path: "itemIds", match: { userId: request.userId } });
    return response.json({
      outfits: outfits.map((outfit) => ({
        ...outfit.toObject(),
        itemIds: outfit.itemIds.filter(Boolean),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function saveOutfit(request, response, next) {
  const body = request.body || {};
  const name = normalizedText(body.name, 80);
  const occasion = normalizedText(body.occasion, 60);
  const notes = normalizedText(body.notes, 500);
  const itemIds = Array.isArray(body.itemIds) ? [...new Set(body.itemIds.map(String))] : [];

  if (!name) return response.status(400).json({ message: "Give this outfit a name." });
  if (!occasion) return response.status(400).json({ message: "Enter the occasion for this outfit." });
  if (body.notes !== undefined && typeof body.notes !== "string") {
    return response.status(400).json({ message: "Outfit notes must be text." });
  }
  if (typeof body.notes === "string" && body.notes.trim().length > 500) {
    return response.status(400).json({ message: "Outfit notes must be 500 characters or fewer." });
  }
  if (itemIds.length < 2 || itemIds.length > 6 || itemIds.some((id) => !mongoose.isValidObjectId(id))) {
    return response.status(400).json({ message: "Choose between 2 and 6 valid wardrobe items." });
  }

  try {
    const ownedItems = await ClothingItem.find({
      _id: { $in: itemIds },
      userId: request.userId,
    }).select("_id");
    if (ownedItems.length !== itemIds.length) {
      return response.status(400).json({ message: "Saved outfits can only include items in your wardrobe." });
    }
    const outfit = await SavedOutfit.create({
      userId: request.userId,
      name,
      occasion,
      notes,
      itemIds: ownedItems.map((item) => item._id),
    });
    await outfit.populate({ path: "itemIds", match: { userId: request.userId } });
    return response.status(201).json({ outfit });
  } catch (error) {
    return next(error);
  }
}

function parseWearDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  const today = new Date().toISOString().slice(0, 10);
  return value <= today ? date : null;
}

async function markSavedOutfitWorn(request, response, next) {
  const wornAt = parseWearDate(request.body?.date);
  if (!wornAt) {
    return response.status(400).json({ message: "Choose a valid date that is not in the future." });
  }
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid saved outfit id." });
    }
    const outfit = await SavedOutfit.findOne({
      _id: request.params.id,
      userId: request.userId,
    });
    if (!outfit) return response.status(404).json({ message: "Saved outfit not found." });

    outfit.wornHistory.push({ wornAt });
    outfit.wornHistory.sort((left, right) => right.wornAt - left.wornAt);
    outfit.wornHistory = outfit.wornHistory.slice(0, 100);
    await outfit.save();
    return response.json({ outfit });
  } catch (error) {
    return next(error);
  }
}

async function deleteSavedOutfit(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid saved outfit id." });
    }
    const outfit = await SavedOutfit.findOneAndDelete({
      _id: request.params.id,
      userId: request.userId,
    });
    if (!outfit) return response.status(404).json({ message: "Saved outfit not found." });
    return response.json({ message: "Saved outfit removed." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  deleteSavedOutfit,
  getRecommendations,
  listSavedOutfits,
  markSavedOutfitWorn,
  saveOutfit,
};
