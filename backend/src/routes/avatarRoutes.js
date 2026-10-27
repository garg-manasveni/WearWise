const express = require("express");
const authenticate = require("../middleware/authenticate");
const {
  deleteAvatar,
  generatePersonalizedAvatar,
  getAvatar,
  getAvatarImage,
  requireAvatarProvider,
} = require("../controllers/avatarController");
const {
  handleAvatarReferenceUpload,
  validateAvatarReference,
} = require("../middleware/avatarReferenceUpload");

const router = express.Router();

router.use(authenticate);
router.get("/", getAvatar);
router.get("/image", getAvatarImage);
router.post(
  "/generate",
  requireAvatarProvider,
  handleAvatarReferenceUpload,
  validateAvatarReference,
  generatePersonalizedAvatar,
);
router.delete("/", deleteAvatar);

module.exports = router;
