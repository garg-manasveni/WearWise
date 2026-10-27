import EmptyState from "../components/EmptyState.jsx";

export default function PlaceholderPage({ title, eyebrow }) {
  return (
    <div className="placeholder-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}<em>, thoughtfully.</em></h1>
      <p className="intro-copy">This part of WearWise is being saved for a future milestone. For now, your style story is just beginning.</p>
      <EmptyState title="A little more room to dream.">
        This page is a placeholder. No wardrobe, recommendation, avatar, or profile data is being created yet.
      </EmptyState>
    </div>
  );
}
