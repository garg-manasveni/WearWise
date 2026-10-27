import { useState } from "react";
import { CATEGORIES } from "../constants/styleOptions.js";
import ColorSwatch from "./ColorSwatch.jsx";
import WardrobePhoto from "./WardrobePhoto.jsx";

function categoryLabel(category) {
  return CATEGORIES.find((option) => option.value === category)?.label || category;
}

export default function OutfitCard({
  outfit,
  wardrobe,
  token,
  outfitKey,
  occasion,
  selectedItems,
  onChangeItem,
  onSave,
  onFindAlternatives,
  saving,
}) {
  const [name, setName] = useState("");
  const categories = [...new Set(outfit.items.map((item) => item.category))];

  return (
    <article className="outfit-card">
      <div className="outfit-card-header">
        <div><p className="eyebrow">{outfit.missingCategories?.length ? "CLOSEST AVAILABLE" : "A LOOK FROM YOUR CLOSET"}</p><h3>{outfit.missingCategories?.length ? "Nearly there." : "A considered combination."}</h3></div>
        <span className="outfit-score">{Math.round(outfit.score)}<small>STYLE<br />MATCH</small></span>
      </div>
      <div className="outfit-piece-grid">
        {outfit.items.map((item) => {
          const currentItem = selectedItems?.[item.category] || item;
          const available = wardrobe.filter((piece) => piece.category === item.category);
          const canSwap = !outfit.missingCategories?.length && available.length > 1;
          return (
            <div className="outfit-piece" key={`${outfitKey}-${item._id}`}>
              <div className="outfit-piece-image">
                <WardrobePhoto item={currentItem} token={token} alt={currentItem.name} />
              </div>
              <div className="outfit-piece-info">
                <span className="outfit-piece-category">{categoryLabel(currentItem.category)}</span>
                <strong>{currentItem.name}</strong>
                <span className="outfit-piece-color"><ColorSwatch color={currentItem.color} />{currentItem.color}</span>
                {canSwap && (
                  <label className="swap-select">
                    <span className="visually-hidden">Change {categoryLabel(item.category)}</span>
                    <select
                      value={currentItem._id}
                      onChange={(event) => {
                        const replacement = available.find((piece) => piece._id === event.target.value);
                        onChangeItem(outfitKey, item.category, replacement);
                      }}
                    >
                      {available.map((piece) => <option key={piece._id} value={piece._id}>{piece.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {outfit.missingCategories?.length ? (
        <p className="missing-piece-note">Still needed: {outfit.missingCategories.join(", ")}.</p>
      ) : (
        <>
          <p className="outfit-explanation">{outfit.explanation}</p>
          {categories.some((category) => selectedItems?.[category]
            && selectedItems[category]._id !== outfit.items.find((item) => item.category === category)?._id) && (
            <button
              className="text-button alternatives-button"
              type="button"
              onClick={() => {
                const changedPiece = categories
                  .map((category) => selectedItems?.[category])
                  .find(Boolean);
                if (changedPiece) onFindAlternatives(changedPiece);
              }}
            >
              Find alternatives around my changed piece ↗
            </button>
          )}
          <div className="save-outfit-row">
            <label className="visually-hidden" htmlFor={`outfit-name-${outfitKey}`}>Name this outfit</label>
            <input id={`outfit-name-${outfitKey}`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name this look" maxLength={80} />
            <button
              className="button button-primary"
              type="button"
              onClick={() => onSave({
                name: name.trim() || `${occasion} edit`,
                itemIds: categories.map((category) =>
                  String(selectedItems?.[category]?._id || outfit.items.find((item) => item.category === category)._id)),
              })}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save look"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}
