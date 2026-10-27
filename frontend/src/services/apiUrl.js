const DEFAULT_API_URL = "http://localhost:5000/api";

function normalizeApiBaseUrl(configuredUrl) {
  const value = typeof configuredUrl === "string" ? configuredUrl.trim() : "";
  const baseUrl = (value || DEFAULT_API_URL).replace(/\/+$/, "");
  return /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
}

export { normalizeApiBaseUrl };
