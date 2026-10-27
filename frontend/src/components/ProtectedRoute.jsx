import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { status, authError, refreshSession } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <main className="route-state" aria-live="polite">
        <span className="loading-mark" aria-hidden="true" />
        <p>Preparing your space…</p>
      </main>
    );
  }
  if (status === "error") {
    return (
      <main className="route-state">
        <p className="eyebrow">A little pause</p>
        <h1>We couldn’t verify your session.</h1>
        <p className="form-error" role="alert">{authError}</p>
        <button className="button button-primary" onClick={refreshSession}>Try again</button>
      </main>
    );
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
