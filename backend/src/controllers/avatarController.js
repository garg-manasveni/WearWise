const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const User = require("../models/User");
const { uploadDirectory } = require("../middleware/imageUpload");
const { AvatarProviderError, generateAvatar } = require("../services/avatarGenerationProvider");

const ALLOWED_STYLES = new Set(["polished_2d", "soft_3d", "editorial"]);

function getPrivateImagePath(imageKey) {
  if (typeof imageKey !== "string" || !/^avatar-[0-9a-f-]+\.png$/i.test(imageKey)) return null;
  return path.join(uploadDirectory, imageKey);
}

function avatarDetails(user) {
  return {
    style: user.avatarIllustrationStyle,
    updatedAt: user.avatarUpdatedAt,
  };
}

async function getAvatar(request, response, next) {
  try {
    const user = await User.findById(request.userId).select("+avatarImageKey");
    if (!user) return response.status(404).json({ message: "Account not found." });
    return response.json({
      available: Boolean(process.env.OPENAI_API_KEY),
      avatar: user.avatarImageKey ? avatarDetails(user) : null,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAvatarImage(request, response, next) {
  try {
    const user = await User.findById(request.userId).select("+avatarImageKey");
    if (!user) return response.status(404).json({ message: "Account not found." });
    if (!user.avatarImageKey) return response.status(404).json({ message: "No personalized avatar is saved." });

    const imagePath = getPrivateImagePath(user.avatarImageKey);
    if (!imagePath) {
      return response.status(404).json({ message: "No personalized avatar is saved." });
    }
    const image = await fs.promises.readFile(imagePath);
    response.set({
      "Cache-Control": "private, no-store",
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
    });
    return response.send(image);
  } catch (error) {
    if (error.code === "ENOENT") {
      return response.status(404).json({ message: "This personalized avatar image is no longer available." });
    }
    return next(error);
  }
}

async function generatePersonalizedAvatar(request, response, next) {
  if (request.body?.consent !== "true") {
    return response.status(400).json({ message: "Explicit consent is required before sending a face photo to OpenAI." });
  }
  if (!ALLOWED_STYLES.has(request.body.style)) {
    return response.status(400).json({ message: "Choose a supported avatar illustration style." });
  }

  let newImagePath;
  try {
    const imageBuffer = await generateAvatar({
      imageBuffer: request.file.buffer,
      mimeType: request.file.mimetype,
      style: request.body.style,
    });
    const imageKey = `avatar-${randomUUID()}.png`;
    newImagePath = path.join(uploadDirectory, imageKey);
    await fs.promises.writeFile(newImagePath, imageBuffer, { flag: "wx" });
    const avatarUpdatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      request.userId,
      {
        $set: {
          avatarImageKey: imageKey,
          avatarIllustrationStyle: request.body.style,
          avatarUpdatedAt,
        },
      },
      { new: false, runValidators: true },
    ).select("+avatarImageKey");
    if (!user) {
      await fs.promises.unlink(newImagePath);
      return response.status(404).json({ message: "Account not found." });
    }
    const previousImageKey = user.avatarImageKey;

    if (previousImageKey && previousImageKey !== imageKey) {
      const previousImagePath = getPrivateImagePath(previousImageKey);
      if (previousImagePath) {
        await fs.promises.unlink(previousImagePath).catch((error) => {
          if (error.code !== "ENOENT") console.error("Could not remove the replaced personalized avatar image.");
        });
      }
    }
    return response.status(201).json({
      avatar: { style: request.body.style, updatedAt: avatarUpdatedAt },
    });
  } catch (error) {
    if (newImagePath) {
      await fs.promises.unlink(newImagePath).catch((cleanupError) => {
        if (cleanupError.code !== "ENOENT") console.error("Could not clean up an incomplete avatar image.");
      });
    }
    if (error instanceof AvatarProviderError) {
      return response.status(error.status).json({ message: error.message });
    }
    return next(error);
  }
}

async function deleteAvatar(request, response, next) {
  try {
    const user = await User.findByIdAndUpdate(
      request.userId,
      {
        $unset: {
          avatarImageKey: 1,
          avatarIllustrationStyle: 1,
          avatarUpdatedAt: 1,
        },
      },
      { new: false },
    ).select("+avatarImageKey");
    if (!user) return response.status(404).json({ message: "Account not found." });

    const previousImageKey = user.avatarImageKey;
    const previousImagePath = getPrivateImagePath(previousImageKey);
    if (previousImagePath) {
      await fs.promises.unlink(previousImagePath).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
    return response.json({ message: "Personalized avatar removed. The illustrated default is ready to use." });
  } catch (error) {
    return next(error);
  }
}

function requireAvatarProvider(request, response, next) {
  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ message: "Personalized avatars are unavailable because OPENAI_API_KEY is not configured. The default illustrated avatar is still available." });
  }
  return next();
}

module.exports = {
  deleteAvatar,
  generatePersonalizedAvatar,
  getAvatar,
  getAvatarImage,
  requireAvatarProvider,
};
