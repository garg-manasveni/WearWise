import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ClothingItemCard from "../components/ClothingItemCard.jsx";
import ClothingItemForm from "../components/ClothingItemForm.jsx";
import EmptyState from "../components/EmptyState.jsx";
import RequestError from "../components/RequestError.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES, COLORS } from "../constants/styleOptions.js";
import { api } from "../services/api.js";

export default function WardrobePage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", color: "", sort: "newest" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formItem, setFormItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const loadSequence = useRef(0);

  const loadItems = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setIsLoading(true);
    setError("");
    try {
      const result = await api.listWardrobe(filters, token);
      if (sequence === loadSequence.current) setItems(result.items);
    } catch (requestError) {
      if (sequence === loadSequence.current) setError(requestError.message);
    } finally {
      if (sequence === loadSequence.current) setIsLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function startAdd() {
    setFormItem(null);
    setShowForm(true);
  }

  async function saveItem(formData) {
    if (formItem) await api.updateWardrobeItem(formItem._id, formData, token);
    else await api.createWardrobeItem(formData, token);
    setShowForm(false);
    setFormItem(null);
    await loadItems();
  }

  async function removeItem(item) {
    if (!window.confirm(`Remove "${item.name}" from your wardrobe?`)) return;
    setError("");
    try {
      await api.deleteWardrobeItem(item._id, token);
      await loadItems();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="wardrobe-page">
      <section className="feature-page-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL COLLECTION</p>
          <h1>My <em>wardrobe.</em></h1>
          <p className="intro-copy">A considered collection of pieces you already own and love.</p>
        </div>
        <div className="wardrobe-heading-count">
          <strong>{items.length}</strong><span>PIECES IN YOUR EDIT</span>
        </div>
      </section>

      <div className="wardrobe-toolbar">
        <label className="search-field">
          <span className="visually-hidden">Search wardrobe</span>
          <span aria-hidden="true">⌕</span>
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search your pieces" />
        </label>
        <label className="toolbar-select">
          <span className="visually-hidden">Filter by category</span>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </label>
        <label className="toolbar-select">
          <span className="visually-hidden">Filter by colour</span>
          <select value={filters.color} onChange={(event) => setFilters((current) => ({ ...current, color: event.target.value }))}>
            <option value="">All colours</option>
            {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
        </label>
        <label className="toolbar-select sort-select">
          <span className="visually-hidden">Sort wardrobe</span>
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
            <option value="newest">Recently added</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>
        </label>
        <button className="button button-primary add-piece-button" type="button" onClick={startAdd}>
          Add a piece <span aria-hidden="true">+</span>
        </button>
      </div>

      {showForm && (
        <ClothingItemForm
          key={formItem?._id || "new"}
          item={formItem}
          token={token}
          onSave={saveItem}
          onCancel={() => {
            setShowForm(false);
            setFormItem(null);
          }}
        />
      )}
      <RequestError message={error} onRetry={loadItems} />

      {isLoading ? (
        <div className="feature-loading" aria-live="polite"><span className="loading-mark" /><p>Opening your wardrobe…</p></div>
      ) : items.length ? (
        <section className="closet-grid" aria-label="Your clothing items">
          {items.map((item) => (
            <ClothingItemCard
              key={item._id}
              item={item}
              token={token}
              onEdit={(selected) => {
                setFormItem(selected);
                setShowForm(true);
              }}
              onDelete={removeItem}
            />
          ))}
        </section>
      ) : (
        <div className="wardrobe-empty">
          <EmptyState
            eyebrow={filters.search || filters.category || filters.color ? "NO MATCHES THIS TIME" : "YOUR FIRST CHAPTER"}
            title={filters.search || filters.category || filters.color ? "Nothing found just yet." : "A closet with possibility."}
          >
            {filters.search || filters.category || filters.color
              ? "Try changing the search or filters to find another piece."
              : "Add a few pieces you own to start building outfit ideas from your real wardrobe."}
          </EmptyState>
          {!filters.search && !filters.category && !filters.color && (
            <button className="button button-primary" type="button" onClick={startAdd}>Add your first item <span aria-hidden="true">↗</span></button>
          )}
        </div>
      )}

      <p className="wardrobe-next-step">Ready to style what you own? <Link to="/outfit-finder">Visit the Outfit Finder ↗</Link></p>
    </div>
  );
}
