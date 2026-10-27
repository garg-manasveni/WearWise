const multer = require("multer");

const imageTypes = {
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/webp": (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2, parts: 3 },
  fileFilter: (request, file, callback) => {
    if (!imageTypes[file.mimetype]) {
      const error = new Error("Upload a JPEG, PNG, or WebP face photo.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function handleAvatarReferenceUpload(request, response, next) {
  upload.single("image")(request, response, (error) => {
    if (!error) return next();
    if (!(error instanceof multer.MulterError) && error.status !== 400) return next(error);
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "The face photo must be 5 MB or smaller."
      : error.message;
    return response.status(400).json({ message });
  });
}

function validateAvatarReference(request, response, next) {
  if (!request.file) {
    return response.status(400).json({ message: "Choose a face photo to create a personalized avatar." });
  }
  const isValidImage = imageTypes[request.file.mimetype]?.(request.file.buffer);
  if (!isValidImage) {
    return response.status(400).json({ message: "The uploaded file is not a valid JPEG, PNG, or WebP image." });
  }
  return next();
}

module.exports = { handleAvatarReferenceUpload, validateAvatarReference };
