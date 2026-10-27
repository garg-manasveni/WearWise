const express = require("express");
const {
  createItem, deleteItem, getItem, getItemImage, listItems, updateItem,
} = require("../controllers/wardrobeController");
const authenticate = require("../middleware/authenticate");
const { handleImageUpload, validateImageSignature } = require("../middleware/imageUpload");

const router = express.Router();

router.use(authenticate);
router.get("/", listItems);
router.post("/", handleImageUpload, validateImageSignature, createItem);
router.get("/:id/image", getItemImage);
router.get("/:id", getItem);
router.patch("/:id", handleImageUpload, validateImageSignature, updateItem);
router.delete("/:id", deleteItem);

module.exports = router;
