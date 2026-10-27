const fs = require("node:fs/promises");
const path = require("node:path");
const mongoose = require("mongoose");
const ClothingItem = require("../models/ClothingItem");
const SavedOutfit = require("../models/SavedOutfit");
const { uploadDirectory } = require("../middleware/imageUpload");

const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"];
const SEASONS = ["spring", "summer", "autumn", "winter"];
const WEATHER = ["warm", "mild", "cold", "rainy"];
const OCCASIONS = ["college", "casual outing", "birthday", "family function", "interview", "dinner", "custom"];

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map((entry) => entry.trim());
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateFields(fields) {
  if (!fields.name || fields.name.length > 80) return "Item name is required and must be 80 characters or fewer.";
  if (!CATEGORIES.includes(fields.category)) return "Choose a valid clothing category.";
  if (!fields.color || fields.color.length > 40) return "Choose a primary colour (up to 40 characters).";
  if (fields.secondaryColor.length > 40) return "Secondary colour must be 40 characters or fewer.";
  if (fields.styleTags.length > 12 || fields.styleTags.some((tag) => tag.length > 30)) {
    return "Add no more than 12 style tags, each 30 characters or fewer.";
  }
  if (fields.occasions.length > 8 || fields.occasions.some((occasion) =>
    occasion.length > 60 || (!OCCASIONS.includes(occasion.toLowerCase()) && occasion.length < 2))) {
    return "Add up to 8 valid suitable occasions.";
  }
  if (fields.seasons.some((season) => !SEASONS.includes(season))) return "Choose valid seasons.";
  if (fields.weather.some((weather) => !WEATHER.includes(weather))) return "Choose valid weather suitability.";
  if (fields.comfortNotes.length > 300) return "Comfort notes must be 300 characters or fewer.";
  return "";
}

function normalizeFields(body) {
  const list = (field) => parseArray(body[field]).map((value) => String(value).trim()).filter(Boolean);
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    category: typeof body.category === "string" ? body.category : "",
    color: typeof body.color === "string" ? body.color.trim() : "",
    secondaryColor: typeof body.secondaryColor === "string" ? body.secondaryColor.trim() : "",
    styleTags: list("styleTags").slice(0, 13),
    occasions: list("occasions").slice(0, 9),
    seasons: list("seasons").slice(0, 5),
    weather: list("weather").slice(0, 5),
    comfortNotes: typeof body.comfortNotes === "string" ? body.comfortNotes.trim() : "",
  };
}

async function removeUpload(file) {
  if (!file) return;
  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function imageFilePath(imageKey) {
  const filename = path.basename(imageKey || "");
  return path.join(uploadDirectory, filename);
}

async function listItems(request, response, next) {
  try {
    const query = { userId: request.userId };
    const { search, category, color } = request.query;
    if (category && CATEGORIES.includes(category)) query.category = category;
    if (color) query.color = new RegExp(`^${escapeRegex(String(color).slice(0, 40))}$`, "i");
    if (search) {
      const safeSearch = new RegExp(escapeRegex(String(search).slice(0, 80)), "i");
      query.$or = [{ name: safeSearch }, { styleTags: safeSearch }];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      "name-asc": { name: 1 },
      "name-desc": { name: -1 },
    };
    const sort = sortOptions[request.query.sort] || sortOptions.newest;
    const items = await ClothingItem.find(query).sort(sort).limit(200);
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function getItem(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid wardrobe item id." });
    }
    const item = await ClothingItem.findOne({ _id: request.params.id, userId: request.userId });
    if (!item) return response.status(404).json({ message: "Wardrobe item not found." });
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
}

async function createItem(request, response, next) {
  if (!request.file) return response.status(400).json({ message: "Choose a photo for this clothing item." });
  try {
    const fields = normalizeFields(request.body || {});
    const validationMessage = validateFields(fields);
    if (validationMessage) {
      await removeUpload(request.file);
      return response.status(400).json({ message: validationMessage });
    }
    const item = await ClothingItem.create({
      ...fields,
      userId: request.userId,
      imageKey: request.file.filename,
    });
    return response.status(201).json({ item });
  } catch (error) {
    await removeUpload(request.file);
    return next(error);
  }
}

async function updateItem(request, response, next) {
  let item;
  let oldImageKey;
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      await removeUpload(request.file);
      return response.status(400).json({ message: "Invalid wardrobe item id." });
    }
    item = await ClothingItem.findOne({ _id: request.params.id, userId: request.userId }).select("+imageKey");
    if (!item) {
      await removeUpload(request.file);
      return response.status(404).json({ message: "Wardrobe item not found." });
    }
    const fields = normalizeFields({ ...item.toObject(), ...(request.body || {}) });
    const validationMessage = validateFields(fields);
    if (validationMessage) {
      await removeUpload(request.file);
      return response.status(400).json({ message: validationMessage });
    }
    oldImageKey = item.imageKey;
    Object.assign(item, fields);
    if (request.file) item.imageKey = request.file.filename;
    await item.save();
  } catch (error) {
    await removeUpload(request.file);
    return next(error);
  }

  if (request.file) {
    try {
      await fs.unlink(imageFilePath(oldImageKey));
    } catch (error) {
      if (error.code !== "ENOENT") return next(error);
    }
  }
  return response.json({ item });
}

async function deleteItem(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid wardrobe item id." });
    }
    const item = await ClothingItem.findOne({ _id: request.params.id, userId: request.userId }).select("+imageKey");
    if (!item) return response.status(404).json({ message: "Wardrobe item not found." });
    const savedReference = await SavedOutfit.exists({ userId: request.userId, itemIds: item._id });
    if (savedReference) {
      return response.status(409).json({
        message: "This piece is used in a saved outfit. Delete that outfit before removing this item.",
      });
    }
    await item.deleteOne();
    await fs.unlink(imageFilePath(item.imageKey)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    return response.json({ message: "Wardrobe item deleted." });
  } catch (error) {
    return next(error);
  }
}

async function getItemImage(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid wardrobe item id." });
    }
    const item = await ClothingItem.findOne({
      _id: request.params.id,
      userId: request.userId,
    }).select("+imageKey");
    if (!item) return response.status(404).json({ message: "Wardrobe item not found." });
    response.set("Cache-Control", "private, no-store");
    return response.sendFile(imageFilePath(item.imageKey), (error) => {
      if (!error || response.headersSent) return;
      if (error.code === "ENOENT") {
        return response.status(404).json({ message: "The photo for this wardrobe item is unavailable." });
      }
      return next(error);
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createItem, deleteItem, getItem, getItemImage, listItems, updateItem,
};
