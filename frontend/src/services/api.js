const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach WearWise. Check that the backend is running.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.message || "The request could not be completed.", response.status);
  }
  return payload;
}

export const api = {
  register: (details) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(details) }),
  login: (credentials) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getCurrentUser: (token) => request("/auth/me", { token }),
};
