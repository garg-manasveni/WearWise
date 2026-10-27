const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const multer = require("multer");

const uploadDirectory = path.resolve(__dirname, "../..", process.env.UPLOAD_DIR || "uploads");
const imageTypes = {
  "image/jpeg": { extension: ".jpg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: ".png", matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: ".webp", matches: (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
};

fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (request, file, callback) => {
      const imageType = imageTypes[file.mimetype];
      callback(null, `${randomUUID()}${imageType?.extension || ".upload"}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 20,
    fieldNameSize: 100,
    fieldSize: 10 * 1024,
    parts: 22,
  },
  fileFilter: (request, file, callback) => {
    if (!imageTypes[file.mimetype]) {
      const error = new Error("Upload a JPEG, PNG, or WebP image.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function handleImageUpload(request, response, next) {
  upload.single("image")(request, response, (error) => {
    if (!error) return next();
    if (!(error instanceof multer.MulterError) && error.status !== 400) return next(error);
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Image must be 5 MB or smaller."
      : error.message;
    return response.status(400).json({ message });
  });
}

async function validateImageSignature(request, response, next) {
  if (!request.file) return next();

  try {
    const bytes = await fs.promises.readFile(request.file.path);
    const imageType = imageTypes[request.file.mimetype];
    if (!imageType?.matches(bytes)) {
      await fs.promises.unlink(request.file.path);
      return response.status(400).json({ message: "The uploaded file is not a valid JPEG, PNG, or WebP image." });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { handleImageUpload, validateImageSignature, uploadDirectory };
