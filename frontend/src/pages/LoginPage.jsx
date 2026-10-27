import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.login({ email: email.trim(), password });
      signIn(result);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-editorial">
        <Link className="brand auth-brand" to="/"><span className="brand-mark">W</span><span>wearwise<span className="brand-period">.</span></span></Link>
        <div className="editorial-copy"><p className="eyebrow">A MORE PERSONAL WAY TO GET DRESSED</p><h1>Less, but<br /><em>more you.</em></h1><p>Your wardrobe, considered. Your style, entirely your own.</p></div>
        <span className="editorial-footer">A STYLE JOURNAL FOR EVERYDAY LIFE <i>—</i> VOL. 01</span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Come on in.</h2>
          <p className="auth-lede">Your personal style space is right where you left it.</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}<span aria-hidden="true">↗</span></button>
          </form>
          <p className="auth-switch">New to WearWise? <Link to="/register">Create an account</Link></p>
          <p className="auth-footnote">Your wardrobe is personal. Your details stay yours.</p>
        </div>
      </section>
    </main>
  );
}
