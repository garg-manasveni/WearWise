require("dotenv").config();

const cors = require("cors");
const dns = require("node:dns");
const express = require("express");
const connectDatabase = require("./src/config/database");
const { createCorsOptions } = require("./src/config/cors");
const authRoutes = require("./src/routes/authRoutes");
const wardrobeRoutes = require("./src/routes/wardrobeRoutes");
const styleProfileRoutes = require("./src/routes/styleProfileRoutes");
const outfitRoutes = require("./src/routes/outfitRoutes");
const avatarRoutes = require("./src/routes/avatarRoutes");

const dnsServers = (process.env.DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
}

const app = express();
const port = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required. Configure backend/.env.");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Configure backend/.env.");
}

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "10kb" }));
app.get("/api/health", (request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/style-profile", styleProfileRoutes);
app.use("/api/outfits", outfitRoutes);
app.use("/api/avatar", avatarRoutes);

app.use((error, request, response, next) => {
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ message: "Request body must be valid JSON." });
  }
  if (error.status === 403 && error.message === "This website origin is not allowed by the WearWise API.") {
    return response.status(403).json({ message: error.message });
  }
  if (error.status === 404 && request.path.startsWith("/uploads/")) {
    return response.status(404).json({ message: "This wardrobe image is no longer available." });
  }
  console.error(error);
  return response.status(500).json({ message: "An unexpected server error occurred." });
});
app.get("/",(req,res)=>{
  res.status(200).json({
    message: "WearWise backend is running"
  });
});
async function startServer() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`WearWise API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start WearWise API:", error.message);
  process.exitCode = 1;
});
