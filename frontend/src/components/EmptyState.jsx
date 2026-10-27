export default function EmptyState({ eyebrow = "A fresh start", title, children }) {
  return (
    <section className="empty-state">
      <span className="empty-state-orbit" aria-hidden="true"><span /></span>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="empty-state-copy">{children}</p>
    </section>
  );
}
