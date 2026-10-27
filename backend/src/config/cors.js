function configuredOrigins(environment = process.env) {
  const values = [
    environment.CLIENT_ORIGIN || "",
    ...(environment.CLIENT_ORIGINS || "").split(","),
  ];

  const origins = values
    .filter((origin) => typeof origin === "string")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return new Set(
    origins.length ? origins : ["http://localhost:5173"]
  );
}

function createCorsOptions(environment = process.env) {
  const allowedOrigins = configuredOrigins(environment);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error(
        "This website origin is not allowed by the WearWise API."
      );
      error.status = 403;
      return callback(error);
    },
  };
}

module.exports = { createCorsOptions };