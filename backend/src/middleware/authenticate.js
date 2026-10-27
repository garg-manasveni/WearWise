const jwt = require("jsonwebtoken");

function authenticate(request, response, next) {
  const authorization = request.get("authorization");
  const [scheme, token] = authorization ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication is required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload === "string" || !payload.sub) {
      return response.status(401).json({ message: "The session token is invalid." });
    }
    request.userId = payload.sub;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return response.status(401).json({ message: "Your session is invalid or has expired." });
    }
    return next(error);
  }
}

module.exports = authenticate;
