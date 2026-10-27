async function getApiErrorMessage(response, fallbackMessage) {
  const responseText = await response.text().catch(() => "");
  let payload = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = {};
    }
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (response.status === 403) {
    return "The server denied this request. Check the backend CORS allowed-origin setting and its deployment logs.";
  }
  if (response.status === 404) {
    return "The API route was not found. Confirm the deployed frontend was rebuilt with VITE_API_URL ending in /api.";
  }
  if (response.status >= 500) {
    return "The backend encountered an error. Check the Render service logs and MongoDB connection.";
  }
  return `${fallbackMessage} (HTTP ${response.status}).`;
}

export { getApiErrorMessage };
