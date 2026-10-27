import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../services/api.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "wearwise_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(token ? "loading" : "unauthenticated");
  const [authError, setAuthError] = useState("");

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
    setAuthError("");
  }, []);

  const refreshSession = useCallback(async () => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
      setAuthError("");
      return;
    }

    setToken(savedToken);
    setStatus("loading");
    setAuthError("");
    try {
      const result = await api.getCurrentUser(savedToken);
      setUser(result.user);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        return;
      }
      setStatus("error");
      setAuthError(error.message);
    }
  }, [clearSession]);

  useEffect(() => {
    if (token) refreshSession();
  }, []); // Restore and validate a saved session once when the app starts.

  const signIn = useCallback((result) => {
    window.localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    setAuthError("");
  }, []);

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, token, status, authError, signIn, signOut, refreshSession }),
    [user, token, status, authError, signIn, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider.");
  return context;
}
