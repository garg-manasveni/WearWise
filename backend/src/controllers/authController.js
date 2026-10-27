const jwt = require("jsonwebtoken");
const User = require("../models/User");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return typeof email === "string" && email.length <= 254 && EMAIL_PATTERN.test(email);
}

function createToken(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function register(request, response, next) {
  try {
    const { name, email, password } = request.body || {};
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || normalizedName.length > 80) {
      return response.status(400).json({ message: "Name is required and must be 80 characters or fewer." });
    }
    if (!validateEmail(normalizedEmail)) {
      return response.status(400).json({ message: "Enter a valid email address." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return response.status(400).json({ message: "Password must be between 8 and 72 characters." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
    });

    return response.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: "An account with this email already exists." });
    }
    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!validateEmail(normalizedEmail) || typeof password !== "string" || !password) {
      return response.status(400).json({ message: "Enter a valid email address and password." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await user.verifyPassword(password))) {
      return response.status(401).json({ message: "Email or password is incorrect." });
    }

    return response.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(request, response, next) {
  try {
    const user = await User.findById(request.userId);
    if (!user) {
      return response.status(401).json({ message: "This account is no longer available." });
    }
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getCurrentUser, login, register };
