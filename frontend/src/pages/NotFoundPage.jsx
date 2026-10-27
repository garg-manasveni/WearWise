import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NotFoundPage() {
  const { status } = useAuth();
  const destination = status === "authenticated" ? "/dashboard" : "/login";

  return (
    <main className="not-found-page">
      <p className="eyebrow">A WRONG TURN, PERHAPS</p>
      <h1>This page isn’t in your <em>edit.</em></h1>
      <p>That address doesn’t match a WearWise page. Your wardrobe is still right where you left it.</p>
      <Link className="button button-primary" to={destination}>
        {status === "authenticated" ? "Back to your space" : "Go to sign in"} <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
