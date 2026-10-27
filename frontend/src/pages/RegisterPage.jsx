import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function RegisterPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!name.trim() || name.trim().length > 80) {
      setError("Enter your name (up to 80 characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Choose a password between 8 and 72 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.register({ name: name.trim(), email: email.trim(), password });
      signIn(result);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-editorial register-editorial">
        <Link className="brand auth-brand" to="/"><span className="brand-mark">W</span><span>wearwise<span className="brand-period">.</span></span></Link>
        <div className="editorial-copy"><p className="eyebrow">YOUR STYLE, YOUR STORY</p><h1>Make room<br />for <em>yourself.</em></h1><p>Start with what you love. The rest can follow.</p></div>
        <span className="editorial-footer">A STYLE JOURNAL FOR EVERYDAY LIFE <i>—</i> VOL. 01</span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">A FRESH START</p>
          <h2>Let’s make it yours.</h2>
          <p className="auth-lede">Create your account to begin your WearWise story.</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="register-name">Your name</label>
            <input id="register-name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we call you?" maxLength={80} required />
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            <label htmlFor="register-password">Password <span className="field-hint">8–72 characters</span></label>
            <input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Choose a password" minLength={8} maxLength={72} required />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating your account…" : "Create account"}<span aria-hidden="true">↗</span></button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          <p className="auth-footnote">Your wardrobe is personal. Your details stay yours.</p>
        </div>
      </section>
    </main>
  );
}
