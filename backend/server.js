require("dotenv").config();

const cors = require("cors");
const dns = require("node:dns");
const express = require("express");
const connectDatabase = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");

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

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);

app.use((error, request, response, next) => {
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ message: "Request body must be valid JSON." });
  }

  console.error(error);
  return response.status(500).json({ message: "An unexpected server error occurred." });
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
