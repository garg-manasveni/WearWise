import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ColorSwatch from "../components/ColorSwatch.jsx";
import EmptyState from "../components/EmptyState.jsx";
import RequestError from "../components/RequestError.jsx";
import WardrobePhoto from "../components/WardrobePhoto.jsx";
import StudioGarmentOverlay from "../components/StudioGarmentOverlay.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { CATEGORIES, OCCASIONS } from "../constants/styleOptions.js";

const EMPTY_SELECTION = {
  tops: "",
  bottoms: "",
  dresses: "",
  outerwear: "",
  shoes: "",
  accessories: "",
};
const INITIAL_GARMENT_POSITIONS = {
  tops: { x: 50, y: 40, scale: 38 },
  bottoms: { x: 50, y: 64, scale: 40 },
  dresses: { x: 50, y: 53, scale: 43 },
  outerwear: { x: 50, y: 42, scale: 46 },
  shoes: { x: 50, y: 86, scale: 30 },
  accessories: { x: 75, y: 48, scale: 22 },
};

function localDateValue() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function displayDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

const AVATAR_STYLES = [
  { skin: "#d8c8bc", hair: "#51454a", label: "Rosewood" },
  { skin: "#edc9a8", hair: "#674832", label: "Honey" },
  { skin: "#a96f54", hair: "#30272b", label: "Sienna" },
  { skin: "#f0d7c6", hair: "#98734d", label: "Sand" },
];

function MannequinIllustration({ avatarStyle, avatarImageUrl }) {
  if (avatarImageUrl) {
    return (
      <img
        className="studio-mannequin studio-personalized-avatar"
        src={avatarImageUrl}
        alt="Your generated illustrated fashion avatar wearing the selected wardrobe combination"
      />
    );
  }

  return (
    <svg className="studio-mannequin" viewBox="0 0 260 500" role="img" aria-labelledby="mannequin-title">
      <title id="mannequin-title">Illustrated avatar wearing the selected wardrobe combination</title>
      <ellipse cx="130" cy="480" rx="83" ry="10" fill="#ddd5d1" />
      <path d="M99 62Q96 17 130 17t32 47l-7 31H105z" fill={avatarStyle.hair} />
      <ellipse cx="130" cy="71" rx="29" ry="36" fill={avatarStyle.skin} />
      <path d="M116 69h3m22 0h3" stroke="#51454a" strokeWidth="3" strokeLinecap="round" />
      <path d="M121 86q9 7 18 0" fill="none" stroke="#9e6767" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 103h36v29h-36z" fill={avatarStyle.skin} />

      <path d="M94 124 69 137 42 233l20 7 35-77 2 108h62l2-108 35 77 20-7-27-96-25-13-34 18z" fill={avatarStyle.skin} stroke="#aa958b" strokeWidth="1.5" />
      <path d="m98 122 32 19 32-19 18 11-13 65H93l-13-65z" fill="#f3ede7" stroke="#c9bcb4" strokeWidth="2" />
      <path d="m104 192-4 74-8 145h28l10-142 10 142h28l-8-145-4-74z" fill="#e2d9d3" stroke="#c9bcb4" strokeWidth="2" />

      <path d="M98 122 130 145l32-23M130 145v20" fill="none" stroke="#fffdfa" strokeOpacity=".7" strokeWidth="2" />
    </svg>
  );
}

function SavedLookCard({ outfit, token, dateValue, onDateChange, onWear, onDelete, isSaving }) {
  const history = [...(outfit.wornHistory || [])]
    .sort((left, right) => new Date(right.wornAt) - new Date(left.wornAt));

  return (
    <article className="studio-saved-card">
      <div className="studio-saved-heading">
        <div>
          <p className="eyebrow">{outfit.occasion}</p>
          <h3>{outfit.name}</h3>
        </div>
        <button className="text-button danger-link" type="button" onClick={() => onDelete(outfit)}>
          Remove
        </button>
      </div>
      {outfit.notes && <p className="studio-saved-notes">{outfit.notes}</p>}
      <div className="studio-saved-items">
        {outfit.itemIds.map((item) => (
          <div className="studio-saved-piece" key={`${outfit._id}-${item._id}`}>
            <WardrobePhoto item={item} token={token} alt="" />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <form className="studio-wear-form" onSubmit={(event) => {
        event.preventDefault();
        onWear(outfit._id, dateValue);
      }}>
        <label className="field-label">
          Worn on
          <input
            type="date"
            value={dateValue}
            max={localDateValue()}
            onChange={(event) => onDateChange(outfit._id, event.target.value)}
            required
          />
        </label>
        <button className="button button-secondary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Mark as worn"}
        </button>
      </form>
      {history.length > 0 && (
        <p className="studio-last-worn">Last worn {displayDate(history[0].wornAt)} · {history.length} {history.length === 1 ? "wear" : "wears"}</p>
      )}
    </article>
  );
}

export default function OutfitStudioPage() {
  const { token } = useAuth();
  const [wardrobe, setWardrobe] = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [notes, setNotes] = useState("");
  const [garmentPositions, setGarmentPositions] = useState(INITIAL_GARMENT_POSITIONS);
  const [positionCategory, setPositionCategory] = useState("tops");
  const avatarFrameRef = useRef(null);
  const [avatarStyleIndex, setAvatarStyleIndex] = useState(
    () => Math.floor(Math.random() * AVATAR_STYLES.length),
  );
  const [avatarReferenceFile, setAvatarReferenceFile] = useState(null);
  const [avatarImageBlob, setAvatarImageBlob] = useState(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState("");
  const [avatarMetadata, setAvatarMetadata] = useState(null);
  const [avatarProviderAvailable, setAvatarProviderAvailable] = useState(null);
  const [avatarIllustrationStyle, setAvatarIllustrationStyle] = useState("polished_2d");
  const [hasAvatarConsent, setHasAvatarConsent] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [wearDates, setWearDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wearingId, setWearingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [combinationIndex, setCombinationIndex] = useState(-1);

  const loadStudio = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setAvatarError("");
    try {
      const [wardrobeResult, savedResult, avatarResult] = await Promise.all([
        api.listWardrobe({}, token),
        api.listSavedOutfits(token),
        api.getAvatar(token),
      ]);
      setWardrobe(wardrobeResult.items);
      setSavedOutfits(savedResult.outfits);
      setAvatarProviderAvailable(avatarResult.available);
      setAvatarMetadata(avatarResult.avatar);
      setAvatarIllustrationStyle(avatarResult.avatar?.style || "polished_2d");
      if (avatarResult.avatar) {
        try {
          setAvatarImageBlob(await api.getAvatarImage(token));
        } catch (avatarRequestError) {
          setAvatarError(avatarRequestError.message);
        }
      } else {
        setAvatarImageBlob(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStudio();
  }, [loadStudio]);

  useEffect(() => {
    if (!avatarImageBlob) {
      setAvatarImageUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(avatarImageBlob);
    setAvatarImageUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarImageBlob]);

  const itemsByCategory = useMemo(() => Object.fromEntries(
    CATEGORIES.map(({ value }) => [value, wardrobe.filter((item) => item.category === value)]),
  ), [wardrobe]);

  const selectedItems = useMemo(() => CATEGORIES
    .map(({ value }) => wardrobe.find((item) => item._id === selection[value]))
    .filter(Boolean), [selection, wardrobe]);
  const activePositionCategory = selectedItems.some((item) => item.category === positionCategory)
    ? positionCategory
    : selectedItems[0]?.category;

  const outfitOptions = useMemo(() => {
    const options = [];
    const shoes = itemsByCategory.shoes;
    for (const shoe of shoes) {
      for (const dress of itemsByCategory.dresses) {
        options.push({ dresses: dress._id, shoes: shoe._id });
        if (options.length >= 300) break;
      }
      if (options.length >= 300) break;
      for (const top of itemsByCategory.tops) {
        for (const bottom of itemsByCategory.bottoms) {
          options.push({ tops: top._id, bottoms: bottom._id, shoes: shoe._id });
          if (options.length >= 300) break;
        }
        if (options.length >= 300) break;
      }
      if (options.length >= 300) break;
    }
    return options;
  }, [itemsByCategory]);

  function chooseItem(category, itemId) {
    setSelection((current) => {
      const next = { ...current, [category]: itemId };
      if (itemId && category === "dresses") {
        next.tops = "";
        next.bottoms = "";
      } else if (itemId && (category === "tops" || category === "bottoms")) {
        next.dresses = "";
      }
      return next;
    });
    if (itemId) setPositionCategory(category);
    setNotice("");
  }

  function updateGarmentPosition(category, field, value) {
    setGarmentPositions((current) => ({
      ...current,
      [category]: {
        ...current[category],
        [field]: Number(value),
      },
    }));
  }

  function chooseAvatarReference(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setAvatarError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Choose a JPEG, PNG, or WebP face photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("The face photo must be 5 MB or smaller.");
      return;
    }
    setAvatarReferenceFile(file);
    setHasAvatarConsent(false);
  }

  function randomizeAvatar() {
    setAvatarStyleIndex((current) => {
      const next = Math.floor(Math.random() * (AVATAR_STYLES.length - 1));
      return next >= current ? next + 1 : next;
    });
    setAvatarError("");
  }

  async function generatePersonalizedAvatar(event) {
    event.preventDefault();
    setAvatarError("");
    if (!avatarReferenceFile) {
      setAvatarError("Choose a face photo before creating your avatar.");
      return;
    }
    if (!hasAvatarConsent) {
      setAvatarError("Please review the privacy notice and give consent before sending your face photo.");
      return;
    }

    const formData = new FormData();
    formData.append("image", avatarReferenceFile);
    formData.append("style", avatarIllustrationStyle);
    formData.append("consent", "true");
    setIsGeneratingAvatar(true);
    try {
      const result = await api.generateAvatar(formData, token);
      setAvatarMetadata(result.avatar);
      setAvatarImageBlob(await api.getAvatarImage(token));
      setAvatarReferenceFile(null);
      setHasAvatarConsent(false);
      setNotice("Your new illustrated avatar is ready. The reference photo was not saved.");
    } catch (requestError) {
      setAvatarError(requestError.message);
    } finally {
      setIsGeneratingAvatar(false);
    }
  }

  async function useDefaultAvatar() {
    setAvatarError("");
    if (avatarMetadata) {
      try {
        await api.deleteAvatar(token);
      } catch (requestError) {
        setAvatarError(requestError.message);
        return;
      }
    }
    setAvatarMetadata(null);
    setAvatarImageBlob(null);
    setAvatarReferenceFile(null);
    setHasAvatarConsent(false);
    randomizeAvatar();
    setNotice("Using an illustrated default avatar.");
  }

  function resetLook() {
    setSelection(EMPTY_SELECTION);
    setCombinationIndex(-1);
    setError("");
    setNotice("The styling board is clear.");
  }

  function nextCombination() {
    if (!outfitOptions.length) return;
    const currentCore = Object.fromEntries(
      ["tops", "bottoms", "dresses", "shoes"].map((category) => [category, selection[category]]),
    );
    const currentIndex = outfitOptions.findIndex((option) =>
      ["tops", "bottoms", "dresses", "shoes"].every((category) => (option[category] || "") === (currentCore[category] || "")));
    const nextIndex = currentIndex < 0
      ? (combinationIndex + 1) % outfitOptions.length
      : (currentIndex + 1) % outfitOptions.length;
    setSelection((current) => ({
      ...current,
      tops: outfitOptions[nextIndex].tops || "",
      bottoms: outfitOptions[nextIndex].bottoms || "",
      dresses: outfitOptions[nextIndex].dresses || "",
      shoes: outfitOptions[nextIndex].shoes || "",
    }));
    setCombinationIndex(nextIndex);
    setNotice("A different combination from your wardrobe is on the board.");
  }

  async function saveLook(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!name.trim()) {
      setError("Give your look a name before saving it.");
      return;
    }
    if (!occasion.trim()) {
      setError("Enter an occasion for this look.");
      return;
    }
    if (selectedItems.length < 2) {
      setError("Choose at least two wardrobe pieces to save this look.");
      return;
    }
    setIsSaving(true);
    try {
      await api.saveOutfit({
        name: name.trim(),
        occasion: occasion.trim(),
        notes: notes.trim(),
        itemIds: selectedItems.map((item) => item._id),
      }, token);
      setName("");
      setNotes("");
      setNotice("Your look is saved to My outfits.");
      await loadStudio();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function markAsWorn(id, date) {
    setError("");
    setNotice("");
    setWearingId(id);
    try {
      await api.markSavedOutfitWorn(id, date, token);
      setNotice("Wear date added to your outfit history.");
      await loadStudio();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWearingId("");
    }
  }

  async function removeOutfit(outfit) {
    if (!window.confirm(`Remove "${outfit.name}" from saved outfits and wear history?`)) return;
    setError("");
    setNotice("");
    try {
      await api.deleteSavedOutfit(outfit._id, token);
      setNotice("Saved look removed.");
      await loadStudio();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const recentHistory = useMemo(() => savedOutfits.flatMap((outfit) =>
    (outfit.wornHistory || []).map((entry) => ({
      ...entry,
      outfitId: outfit._id,
      outfitName: outfit.name,
      occasion: outfit.occasion,
    }))).sort((left, right) => new Date(right.wornAt) - new Date(left.wornAt)).slice(0, 12),
  [savedOutfits]);

  if (isLoading) {
    return <div className="feature-loading" aria-live="polite"><span className="loading-mark" /><p>Setting up your styling studio…</p></div>;
  }

  return (
    <div className="studio-page">
      <section className="feature-page-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL LOOKBOOK</p>
          <h1>Outfit <em>studio.</em></h1>
          <p className="intro-copy">Arrange real pieces from your wardrobe, save a look, and keep a simple record of when you wear it.</p>
        </div>
        <span className="studio-heading-mark" aria-hidden="true">✳</span>
      </section>

      <RequestError message={error} onRetry={loadStudio} />
      {notice && <p className="success-message" role="status">{notice}</p>}

      {wardrobe.length === 0 ? (
        <section className="studio-empty">
          <EmptyState eyebrow="A STUDIO NEEDS A FEW PIECES" title="Start with your own wardrobe.">
            Add clothes you own first; the styling board only uses your saved items.
          </EmptyState>
          <Link className="button button-primary" to="/wardrobe">Add wardrobe pieces <span aria-hidden="true">↗</span></Link>
        </section>
      ) : (
        <section className="studio-workspace" aria-label="Outfit styling board">
          <div className="studio-board">
            <div className="studio-board-top">
              <div><p className="eyebrow">THE LOOK IN PROGRESS</p><h2>Your styling board</h2></div>
              <span>{selectedItems.length} PIECES</span>
            </div>
            <div className="studio-preview">
              <div className="studio-avatar-panel">
                <div className="studio-avatar-tools">
                  {!avatarMetadata && (
                    <button className="text-button" type="button" onClick={randomizeAvatar}>
                      Choose a random illustrated avatar
                    </button>
                  )}
                  {avatarMetadata && (
                    <button className="text-button" type="button" onClick={useDefaultAvatar}>
                      Use a default avatar
                    </button>
                  )}
                </div>
                {avatarError && <p className="studio-avatar-error" role="alert">{avatarError}</p>}
                <div className="studio-avatar-stage" ref={avatarFrameRef}>
                  <MannequinIllustration
                    avatarStyle={AVATAR_STYLES[avatarStyleIndex]}
                    avatarImageUrl={avatarImageUrl}
                  />
                  {selectedItems.map((item) => (
                    <StudioGarmentOverlay
                      key={item._id}
                      item={item}
                      token={token}
                      frameRef={avatarFrameRef}
                      position={garmentPositions[item.category]}
                      onPositionChange={(position) => setGarmentPositions((current) => ({
                        ...current,
                        [item.category]: position,
                      }))}
                    />
                  ))}
                </div>
                <p>{avatarMetadata ? "Personalized illustrated character · not a realistic try-on" : `${AVATAR_STYLES[avatarStyleIndex].label} illustrated avatar`}</p>
                {avatarProviderAvailable === false ? (
                  <p className="studio-avatar-provider-note">
                    Personalized avatar generation is not configured. The illustrated default remains available.
                  </p>
                ) : (
                  <form className="studio-avatar-form" onSubmit={generatePersonalizedAvatar}>
                    <label className="field-label">
                      Illustration style
                      <select
                        value={avatarIllustrationStyle}
                        onChange={(event) => setAvatarIllustrationStyle(event.target.value)}
                        disabled={isGeneratingAvatar}
                      >
                        <option value="polished_2d">Polished 2D fashion illustration</option>
                        <option value="soft_3d">Soft 3D-inspired cartoon</option>
                        <option value="editorial">Editorial fashion character</option>
                      </select>
                    </label>
                    <label className="studio-avatar-upload">
                      <span>{avatarReferenceFile ? avatarReferenceFile.name : "Choose an optional face photo"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={chooseAvatarReference}
                        disabled={isGeneratingAvatar}
                      />
                    </label>
                    <p className="studio-avatar-provider-note">
                      A newly illustrated character will be generated from the reference; the original photo is not shown as the avatar. A recognizable likeness is not guaranteed. WearWise sends the photo to OpenAI only after consent and does not save the original. OpenAI says API data is not used for model training by default, but may be retained for up to 30 days for abuse monitoring; image-generation calls may incur usage charges.
                      {" "}<a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noreferrer">OpenAI data policy</a>
                    </p>
                    <label className="studio-avatar-consent">
                      <input
                        type="checkbox"
                        checked={hasAvatarConsent}
                        onChange={(event) => setHasAvatarConsent(event.target.checked)}
                        disabled={isGeneratingAvatar || !avatarReferenceFile}
                      />
                      <span>I have permission to use this photo and consent to sending it to OpenAI to create my avatar.</span>
                    </label>
                    <button
                      className="button button-secondary studio-avatar-generate"
                      type="submit"
                      disabled={isGeneratingAvatar || !avatarReferenceFile || !hasAvatarConsent}
                    >
                      {isGeneratingAvatar
                        ? "Creating your avatar…"
                        : avatarMetadata ? "Regenerate avatar" : "Create personalized avatar"}
                    </button>
                    {isGeneratingAvatar && <p className="studio-avatar-provider-note" role="status">This may take a little while. Your current avatar stays in place until the new one succeeds.</p>}
                  </form>
                )}
              </div>
              <div className="studio-flatlay" aria-label="Selected clothing photo collage">
                {selectedItems.length ? selectedItems.map((item) => (
                  <article className="studio-flatlay-item" key={item._id}>
                    <div className="studio-flatlay-photo"><WardrobePhoto item={item} token={token} alt={item.name} /></div>
                    <div className="studio-flatlay-caption">
                      <span>{CATEGORIES.find((category) => category.value === item.category)?.label}</span>
                      <strong>{item.name}</strong>
                      <span className="studio-flatlay-color"><ColorSwatch color={item.color} />{item.color}</span>
                    </div>
                  </article>
                )) : (
                  <div className="studio-preview-empty">
                    <p>Select pieces to build your first look.</p>
                  </div>
                )}
              </div>
            </div>
            <p className="studio-disclaimer">The selected wardrobe photos are layered over the illustrated avatar and can be dragged or adjusted below. Photos with opaque backgrounds remain rectangular; transparent garment cutouts give the cleanest result. This 2D board is a manual collage, not realistic virtual try-on.</p>
            <div className="studio-board-actions">
              <button className="button button-secondary" type="button" onClick={nextCombination} disabled={!outfitOptions.length}>
                Try another combination <span aria-hidden="true">↗</span>
              </button>
              <button className="text-button" type="button" onClick={resetLook}>Reset look</button>
            </div>
          </div>

          <aside className="studio-controls">
            <div className="studio-control-heading"><p className="eyebrow">YOUR OWN PIECES</p><h2>Style it your way.</h2><p>Choose one piece per category. Dresses replace tops and bottoms in a look.</p></div>
            <div className="studio-selectors">
              {CATEGORIES.map(({ value, label }) => (
                <label className="field-label" key={value}>
                  {label}
                  <select value={selection[value]} onChange={(event) => chooseItem(value, event.target.value)}>
                    <option value="">No selection</option>
                    {itemsByCategory[value].map((item) => (
                      <option key={item._id} value={item._id}>{item.name} · {item.color}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {selectedItems.length > 0 && (
              <section className="studio-position-controls" aria-label="Garment photo positioning controls">
                <label className="field-label">Adjust photo
                  <select value={activePositionCategory} onChange={(event) => setPositionCategory(event.target.value)}>
                    {selectedItems.map((item) => (
                      <option key={item.category} value={item.category}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <label className="studio-range-label">Horizontal position
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={garmentPositions[activePositionCategory].x}
                    onChange={(event) => updateGarmentPosition(activePositionCategory, "x", event.target.value)}
                  />
                </label>
                <label className="studio-range-label">Vertical position
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={garmentPositions[activePositionCategory].y}
                    onChange={(event) => updateGarmentPosition(activePositionCategory, "y", event.target.value)}
                  />
                </label>
                <label className="studio-range-label">Photo width
                  <input
                    type="range"
                    min="12"
                    max="75"
                    value={garmentPositions[activePositionCategory].scale}
                    onChange={(event) => updateGarmentPosition(activePositionCategory, "scale", event.target.value)}
                  />
                </label>
              </section>
            )}
            <div className="studio-summary">
              <h3>In this look</h3>
              {selectedItems.length ? (
                <ul>{selectedItems.map((item) => <li key={item._id}><span>{item.name}</span><button type="button" className="studio-remove-piece" onClick={() => chooseItem(item.category, "")} aria-label={`Remove ${item.name}`}>Remove</button></li>)}</ul>
              ) : <p>Nothing selected yet.</p>}
            </div>
            <form className="studio-save-form" onSubmit={saveLook}>
              <label className="field-label">Name your look
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="e.g. Easy campus morning" />
              </label>
              <label className="field-label">Occasion
                <input value={occasion} onChange={(event) => setOccasion(event.target.value)} maxLength={60} required placeholder="e.g. College" />
              </label>
              <label className="field-label">Styling notes <span className="field-optional">optional · 500 characters</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={3} placeholder="A note for your future self…" />
              </label>
              <button className="button button-primary" type="submit" disabled={isSaving || selectedItems.length < 2}>
                {isSaving ? "Saving your look…" : "Save this look"} <span aria-hidden="true">↗</span>
              </button>
              {selectedItems.length < 2 && <p className="studio-form-hint">Choose at least two items to save.</p>}
            </form>
          </aside>
        </section>
      )}

      <section className="studio-collection">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR PERSONAL LOOKBOOK</p><h2>Saved outfits</h2></div>
          <span className="section-index">{savedOutfits.length} SAVED</span>
        </div>
        {savedOutfits.length ? (
          <div className="studio-saved-grid">
            {savedOutfits.map((outfit) => (
              <SavedLookCard
                key={outfit._id}
                outfit={outfit}
                token={token}
                dateValue={wearDates[outfit._id] || localDateValue()}
                onDateChange={(id, value) => setWearDates((current) => ({ ...current, [id]: value }))}
                onWear={markAsWorn}
                onDelete={removeOutfit}
                isSaving={wearingId === outfit._id}
              />
            ))}
          </div>
        ) : (
          <EmptyState eyebrow="THE LOOKBOOK IS OPEN" title="Your first saved look belongs here.">
            Create a combination above or save an idea from Outfit Finder.
          </EmptyState>
        )}
      </section>

      <section className="studio-history">
        <div className="section-heading">
          <div><p className="eyebrow">A GENTLE MEMORY</p><h2>Recently worn</h2></div>
          <span className="section-index">LAST 12 WEARS</span>
        </div>
        {recentHistory.length ? (
          <ol className="studio-history-list">
            {recentHistory.map((entry) => (
              <li key={`${entry._id || entry.outfitId}-${entry.wornAt}`}>
                <time dateTime={new Date(entry.wornAt).toISOString()}>{displayDate(entry.wornAt)}</time>
                <span>{entry.outfitName}</span>
                <span>{entry.occasion}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState eyebrow="NO WEAR NOTES YET" title="Your recent outfits will appear here.">
            Mark a saved look as worn to start a simple history.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
