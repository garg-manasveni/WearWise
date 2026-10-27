const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
let unauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach WearWise. Check that the backend is running.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler();
    throw new ApiError(payload.message || "The request could not be completed.", response.status);
  }
  return payload;
}

async function requestBlob(path, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error("Could not reach WearWise. Check that the backend is running.");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) unauthorizedHandler();
    throw new ApiError(payload.message || "The image could not be loaded.", response.status);
  }
  return response.blob();
}

function queryString(values) {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export const api = {
  register: (details) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(details) }),
  login: (credentials) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getCurrentUser: (token) => request("/auth/me", { token }),
  listWardrobe: (filters, token) => request(`/wardrobe${queryString(filters)}`, { token }),
  getWardrobeItem: (id, token) => request(`/wardrobe/${id}`, { token }),
  createWardrobeItem: (formData, token) =>
    request("/wardrobe", { method: "POST", body: formData, token }),
  updateWardrobeItem: (id, formData, token) =>
    request(`/wardrobe/${id}`, { method: "PATCH", body: formData, token }),
  deleteWardrobeItem: (id, token) =>
    request(`/wardrobe/${id}`, { method: "DELETE", token }),
  getWardrobeImage: (id, token) => requestBlob(`/wardrobe/${id}/image`, token),
  getStyleProfile: (token) => request("/style-profile", { token }),
  saveStyleProfile: (profile, token) =>
    request("/style-profile", { method: "PUT", body: JSON.stringify(profile), token }),
  recommendOutfits: (preferences, token) =>
    request("/outfits/recommend", { method: "POST", body: JSON.stringify(preferences), token }),
  listSavedOutfits: (token) => request("/outfits/saved", { token }),
  saveOutfit: (outfit, token) =>
    request("/outfits/saved", { method: "POST", body: JSON.stringify(outfit), token }),
  markSavedOutfitWorn: (id, date, token) =>
    request(`/outfits/saved/${id}/worn`, { method: "POST", body: JSON.stringify({ date }), token }),
  deleteSavedOutfit: (id, token) =>
    request(`/outfits/saved/${id}`, { method: "DELETE", token }),
  getAvatar: (token) => request("/avatar", { token }),
  getAvatarImage: (token) => requestBlob("/avatar/image", token),
  generateAvatar: (formData, token) =>
    request("/avatar/generate", { method: "POST", body: formData, token }),
  deleteAvatar: (token) => request("/avatar", { method: "DELETE", token }),
};
