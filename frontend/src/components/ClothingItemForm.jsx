import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES, COLORS, OCCASIONS, SEASONS, WEATHER,
} from "../constants/styleOptions.js";
import WardrobePhoto from "./WardrobePhoto.jsx";

const EMPTY_FORM = {
  name: "",
  category: "",
  color: "",
  secondaryColor: "",
  styleTags: "",
  occasions: [],
  seasons: [],
  weather: [],
  comfortNotes: "",
};

function toggleChoice(values, value) {
  return values.includes(value) ? values.filter((choice) => choice !== value) : [...values, value];
}

function ChoiceGroup({ label, options, selected, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend>{label}</legend>
      <div className="choice-options">
        {options.map((option) => (
          <label className="check-choice" key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(toggleChoice(selected, option))}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ClothingItemForm({ item, token, onSave, onCancel }) {
  const [values, setValues] = useState(() => item
    ? {
      name: item.name || "",
      category: item.category || "",
      color: item.color || "",
      secondaryColor: item.secondaryColor || "",
      styleTags: (item.styleTags || []).join(", "),
      occasions: item.occasions || [],
      seasons: item.seasons || [],
      weather: item.weather || [],
      comfortNotes: item.comfortNotes || "",
    }
    : EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const localPreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!values.name.trim()) return setError("Give this piece a name.");
    if (!values.category) return setError("Choose a clothing category.");
    if (!values.color.trim()) return setError("Enter its primary colour.");
    if (!item && !file) return setError("Choose a photo for this clothing item.");
    if (values.styleTags.split(",").filter((tag) => tag.trim()).length > 12) {
      return setError("Add no more than 12 style tags.");
    }

    const formData = new FormData();
    formData.append("name", values.name.trim());
    formData.append("category", values.category);
    formData.append("color", values.color.trim());
    formData.append("secondaryColor", values.secondaryColor.trim());
    formData.append("styleTags", JSON.stringify(values.styleTags.split(",").map((tag) => tag.trim()).filter(Boolean)));
    formData.append("occasions", JSON.stringify(values.occasions));
    formData.append("seasons", JSON.stringify(values.seasons));
    formData.append("weather", JSON.stringify(values.weather));
    formData.append("comfortNotes", values.comfortNotes.trim());
    if (file) formData.append("image", file);

    setIsSaving(true);
    try {
      await onSave(formData, token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const preview = localPreview || item?.imageUrl;

  return (
    <form className="item-form" onSubmit={submit} noValidate>
      <div className="item-form-heading">
        <div>
          <p className="eyebrow">{item ? "REFINE YOUR EDIT" : "ADD TO YOUR EDIT"}</p>
          <h2>{item ? "Edit this piece" : "A new favourite."}</h2>
        </div>
        <button className="text-button" type="button" onClick={onCancel}>Close</button>
      </div>

      <div className="item-form-layout">
        <div className="item-image-field">
          <div className={`image-preview${preview ? " has-image" : ""}`}>
            {localPreview
              ? <img src={localPreview} alt="Preview of the clothing item" />
              : item
                ? <WardrobePhoto item={item} token={token} alt="Current clothing item photo" />
                : <span>PHOTO<br />PREVIEW</span>}
          </div>
          <label className="file-picker">
            <span>{file ? file.name : item ? "Replace photo (optional)" : "Choose a photo"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setError("");
              }}
            />
          </label>
          <p className="field-note">JPEG, PNG or WebP · up to 5 MB</p>
        </div>

        <div className="item-form-fields">
          <div className="form-grid-two">
            <label className="field-label">Item name
              <input name="name" value={values.name} onChange={updateField} maxLength={80} placeholder="e.g. Linen shirt" required />
            </label>
            <label className="field-label">Category
              <select name="category" value={values.category} onChange={updateField} required>
                <option value="">Select category</option>
                {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>
            <label className="field-label">Primary colour
              <input name="color" list="wardrobe-colors" value={values.color} onChange={updateField} maxLength={40} placeholder="e.g. Ivory" required />
              <datalist id="wardrobe-colors">{COLORS.map((color) => <option key={color} value={color} />)}</datalist>
            </label>
            <label className="field-label">Secondary colour <span className="field-optional">optional</span>
              <input name="secondaryColor" list="wardrobe-colors" value={values.secondaryColor} onChange={updateField} maxLength={40} placeholder="If it has one" />
            </label>
          </div>
          <label className="field-label">Style tags <span className="field-optional">comma separated</span>
            <input name="styleTags" value={values.styleTags} onChange={updateField} placeholder="e.g. relaxed, classic, minimal" />
          </label>
          <ChoiceGroup label="Suitable occasions" options={OCCASIONS} selected={values.occasions} onChange={(occasions) => setValues((current) => ({ ...current, occasions }))} />
          <ChoiceGroup label="Season" options={SEASONS} selected={values.seasons} onChange={(seasons) => setValues((current) => ({ ...current, seasons }))} />
          <ChoiceGroup label="Weather" options={WEATHER} selected={values.weather} onChange={(weather) => setValues((current) => ({ ...current, weather }))} />
          <label className="field-label">Comfort notes <span className="field-optional">optional</span>
            <textarea name="comfortNotes" value={values.comfortNotes} onChange={updateField} maxLength={300} rows={2} placeholder="Soft fabric, easy to move in…" />
          </label>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="item-form-actions">
        <button className="button button-primary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving piece…" : item ? "Save changes" : "Add to wardrobe"}
          <span aria-hidden="true">↗</span>
        </button>
        <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
      </div>
    </form>
  );
}
