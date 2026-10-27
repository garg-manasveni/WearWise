const express = require("express");
const { getProfile, saveProfile } = require("../controllers/styleProfileController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.use(authenticate);
router.get("/", getProfile);
router.put("/", saveProfile);

module.exports = router;
