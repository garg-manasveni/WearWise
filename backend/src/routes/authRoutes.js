const express = require("express");
const { getCurrentUser, login, register } = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
