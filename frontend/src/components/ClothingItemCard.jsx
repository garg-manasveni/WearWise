import ColorSwatch from "./ColorSwatch.jsx";
import WardrobePhoto from "./WardrobePhoto.jsx";

export default function ClothingItemCard({ item, token, onEdit, onDelete }) {
  return (
    <article className="closet-card">
      <div className="closet-card-image">
        <WardrobePhoto item={item} token={token} alt={item.name} />
        <span className="closet-category">{item.category || "Not classified"}</span>
      </div>
      <div className="closet-card-details">
        <div className="closet-item-title">
          <h3>{item.name}</h3>
          <div className="closet-color-pair" aria-label={item.color ? `Primary colour ${item.color}${item.secondaryColor ? `, secondary colour ${item.secondaryColor}` : ""}` : "Primary colour not added"}>
            {item.color && <ColorSwatch color={item.color} label={item.color} />}
            {item.secondaryColor && <ColorSwatch color={item.secondaryColor} label={item.secondaryColor} />}
          </div>
        </div>
        {(!item.category || !item.color) && (
          <p className="closet-metadata-note">
            {!item.category ? "Add a category to include this piece in outfit combinations." : "Add a colour to improve colour-aware styling."}
          </p>
        )}
        <p className="closet-item-tags">{item.styleTags?.length ? item.styleTags.join(" · ") : "Style tags not added"}</p>
        <div className="closet-card-actions">
          <button className="text-button" type="button" onClick={() => onEdit(item)}>Edit piece</button>
          <button className="text-button danger-link" type="button" onClick={() => onDelete(item)}>Remove</button>
        </div>
      </div>
    </article>
  );
}
