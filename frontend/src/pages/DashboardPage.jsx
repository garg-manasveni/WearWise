import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">A NOTE TO SELF</p>
          <h1>A considered wardrobe<br /><em>starts here.</em></h1>
          <p className="intro-copy">Good morning, {user?.name?.split(" ")[0]}. This is your space to make getting dressed feel a little more like you.</p>
        </div>
        <div className="intro-stamp" aria-label="WearWise style journal">
          <span>THE</span><strong>W</strong><span>STYLE JOURNAL</span><i>EST. 2025</i>
        </div>
      </section>

      <section className="dashboard-meta" aria-label="Wardrobe summary">
        <div className="meta-item"><span className="meta-label">IN YOUR WARDROBE</span><strong>—</strong><span>pieces collected</span></div>
        <div className="meta-divider" />
        <div className="meta-item"><span className="meta-label">YOUR STYLE NOTES</span><strong>—</strong><span>preferences saved</span></div>
        <div className="meta-aside">A little intention<br />goes a long way.</div>
      </section>

      <div className="section-heading">
        <div><p className="eyebrow">THE BEGINNING</p><h2>Your style, in the making</h2></div>
        <span className="section-index">01 — 04</span>
      </div>

      <div className="dashboard-grid">
        <article className="feature-card feature-lavender">
          <div className="feature-card-top"><span>01 / COLLECT</span><span className="feature-symbol">✳</span></div>
          <div><p className="feature-kicker">YOUR EVERYDAY EDIT</p><h3>Build a wardrobe<br />that feels like you.</h3><p>Keep the pieces you love in one thoughtful place.</p></div>
          <span className="feature-arrow" aria-hidden="true">↗</span>
        </article>
        <article className="feature-card feature-rose">
          <div className="feature-card-top"><span>02 / DISCOVER</span><span className="feature-symbol">✳</span></div>
          <div><p className="feature-kicker">A NEW PERSPECTIVE</p><h3>Find the outfit<br />you didn’t expect.</h3><p>Make more of what’s already in your closet.</p></div>
          <span className="feature-arrow" aria-hidden="true">↗</span>
        </article>
      </div>

      <EmptyState eyebrow="YOUR FIRST CHAPTER" title="Nothing in the closet. Yet.">
        Your wardrobe is waiting to take shape. Wardrobe tools are coming in a later project milestone.
      </EmptyState>
    </div>
  );
}
