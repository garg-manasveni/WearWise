import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import OutfitCard from "../components/OutfitCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  COLORS, COMFORT_PREFERENCES, OCCASIONS, STYLES, WEATHER,
} from "../constants/styleOptions.js";
import { api } from "../services/api.js";
import WardrobePhoto from "../components/WardrobePhoto.jsx";

const INITIAL_PREFERENCES = {
  occasion: "college",
  customOccasion: "",
  mood: "comfortable",
  style: "",
  color: "",
  weather: "",
  comfort: "",
  anchorItemId: "",
};

const MOODS = ["comfortable", "confident", "elegant", "playful", "relaxed", "experimental"];
const SEASONS = ["spring", "summer", "autumn", "winter"];

function OutfitFinderForm({ preferences, setPreferences, profile, wardrobe, onSubmit, isLoading }) {
  function update(event) {
    const { name, value } = event.target;
    setPreferences((current) => ({ ...current, [name]: value }));
  }

  return (
    <form className="finder-form" onSubmit={onSubmit}>
      <div className="finder-form-heading">
        <p className="eyebrow">LET’S FIND YOUR FEEL</p>
        <h2>Tell me about today.</h2>
        <p>Every suggestion is made only from pieces you’ve saved in your wardrobe.</p>
      </div>
      <div className="finder-fields">
        <label className="field-label">The occasion
          <select name="occasion" value={preferences.occasion} onChange={update}>
            {OCCASIONS.map((occasion) => <option key={occasion} value={occasion}>{occasion}</option>)}
            <option value="custom">Something else…</option>
          </select>
        </label>
        {preferences.occasion === "custom" && (
          <label className="field-label">Your occasion
            <input name="customOccasion" value={preferences.customOccasion} onChange={update} placeholder="e.g. gallery opening" maxLength={60} required />
          </label>
        )}
        <label className="field-label">The mood
          <select name="mood" value={preferences.mood} onChange={update}>
            {MOODS.map((mood) => <option key={mood} value={mood}>{mood}</option>)}
          </select>
        </label>
        <label className="field-label">A style direction <span className="field-optional">optional</span>
          <select name="style" value={preferences.style} onChange={update}>
            <option value="">Surprise me</option>
            {[...new Set([...(profile?.preferredStyles || []), ...STYLES])].map((style) => <option key={style} value={style}>{style}</option>)}
          </select>
        </label>
        <label className="field-label">A colour to explore <span className="field-optional">optional</span>
          <select name="color" value={preferences.color} onChange={update}>
            <option value="">No colour preference</option>
            {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
        </label>
        <label className="field-label">Weather / season <span className="field-optional">optional</span>
          <select name="weather" value={preferences.weather} onChange={update}>
            <option value="">Any weather</option>
            <optgroup label="Weather">{WEATHER.map((weather) => <option key={weather} value={weather}>{weather}</option>)}</optgroup>
            <optgroup label="Season">{SEASONS.map((season) => <option key={season} value={season}>{season}</option>)}</optgroup>
          </select>
        </label>
        <label className="field-label">Comfort detail <span className="field-optional">optional</span>
          <select name="comfort" value={preferences.comfort} onChange={update}>
            <option value="">No extra comfort note</option>
            <option value="comfortable">Comfortable above all</option>
            {COMFORT_PREFERENCES.map((comfort) => <option key={comfort} value={comfort.toLowerCase()}>{comfort}</option>)}
          </select>
        </label>
        <label className="field-label finder-anchor">Build around a piece <span className="field-optional">optional</span>
          <select name="anchorItemId" value={preferences.anchorItemId} onChange={update}>
            <option value="">No particular piece</option>
            {wardrobe.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.category}</option>)}
          </select>
        </label>
      </div>
      <p className="profile-privacy-note">Your optional complexion and undertone notes never restrict outfit colours. Every colour and style is for everyone.</p>
      <button className="button button-primary finder-submit" type="submit" disabled={isLoading}>
        {isLoading ? "Considering your pieces…" : "Find my outfits"} <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

function SavedOutfitCard({ outfit, token, onDeleted }) {
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm(`Remove "${outfit.name}" from saved outfits?`)) return;
    setError("");
    try {
      await api.deleteSavedOutfit(outfit._id, token);
      await onDeleted();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <article className="saved-outfit-card">
      <div className="saved-outfit-head"><div><p className="eyebrow">{outfit.occasion}</p><h3>{outfit.name}</h3></div><button className="text-button danger-link" onClick={remove}>Remove</button></div>
      <div className="saved-outfit-items">
        {outfit.itemIds.map((item) => (
          <div className="saved-piece" key={item._id}>
            <WardrobePhoto item={item} token={token} alt="" />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </article>
  );
}

export default function OutfitFinderPage() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState(INITIAL_PREFERENCES);
  const [wardrobe, setWardrobe] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [results, setResults] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFinding, setIsFinding] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSavedOutfits = useCallback(async () => {
    const result = await api.listSavedOutfits(token);
    setSavedOutfits(result.outfits);
  }, [token]);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [wardrobeResult, profileResult, savedResult] = await Promise.all([
        api.listWardrobe({}, token),
        api.getStyleProfile(token),
        api.listSavedOutfits(token),
      ]);
      setWardrobe(wardrobeResult.items);
      setProfile(profileResult.profile);
      setSavedOutfits(savedResult.outfits);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  async function submitFinder(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const occasion = preferences.occasion === "custom"
      ? preferences.customOccasion.trim()
      : preferences.occasion;
    if (!occasion) {
      setError("Enter the occasion so your outfit ideas have a starting point.");
      return;
    }
    setIsFinding(true);
    try {
      const result = await api.recommendOutfits({
        ...preferences,
        occasion,
      }, token);
      setResults(result);
      setSelectedItems({});
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsFinding(false);
    }
  }

  async function saveRecommendedOutfit(candidateKey, payload, occasion) {
    setSavingKey(candidateKey);
    setError("");
    setNotice("");
    try {
      await api.saveOutfit({ ...payload, occasion }, token);
      await loadSavedOutfits();
      setNotice("Your look is saved to My outfits.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingKey("");
    }
  }

  async function requestAlternatives(item) {
    setPreferences((current) => ({ ...current, anchorItemId: item._id }));
    setError("");
    setIsFinding(true);
    try {
      const occasion = preferences.occasion === "custom"
        ? preferences.customOccasion.trim()
        : preferences.occasion;
      const result = await api.recommendOutfits({
        ...preferences,
        occasion,
        anchorItemId: item._id,
      }, token);
      setResults(result);
      setSelectedItems({});
      setNotice(`Showing alternatives built around ${item.name}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsFinding(false);
    }
  }

  if (isLoading) {
    return <div className="feature-loading" aria-live="polite"><span className="loading-mark" /><p>Setting the scene…</p></div>;
  }

  const occasionLabel = preferences.occasion === "custom"
    ? preferences.customOccasion.trim()
    : preferences.occasion;

  return (
    <div className="finder-page">
      <section className="feature-page-heading finder-heading">
        <div>
          <p className="eyebrow">A THOUGHTFUL SECOND OPINION</p>
          <h1>Outfit <em>finder.</em></h1>
          <p className="intro-copy">A personal styling prompt, answered only with clothes you already own.</p>
        </div>
        <span className="finder-ornament" aria-hidden="true">✳</span>
      </section>

      {error && <div className="inline-error" role="alert"><p>{error}</p><button className="text-button" onClick={loadPage}>Reload</button></div>}
      {notice && <p className="success-message" role="status">{notice}</p>}
      {wardrobe.length === 0 && (
        <div className="wardrobe-prompt">
          <p>Your outfit ideas start with what you own.</p>
          <Link className="button button-primary" to="/wardrobe">Add your first piece <span aria-hidden="true">↗</span></Link>
        </div>
      )}

      <div className="finder-layout">
        <OutfitFinderForm
          preferences={preferences}
          setPreferences={setPreferences}
          profile={profile}
          wardrobe={wardrobe}
          token={token}
          onSubmit={submitFinder}
          isLoading={isFinding}
        />
        <section className="recommendation-column" aria-live="polite">
          {!results ? (
            <EmptyState eyebrow="YOUR NEXT LOOK" title="Start with how you want to feel.">
              Choose a few details and WearWise will put together distinct looks using your saved pieces.
            </EmptyState>
          ) : (
            <>
              <div className="recommendation-heading">
                <div><p className="eyebrow">YOUR EDIT FOR {occasionLabel.toUpperCase()}</p><h2>{results.recommendations.length ? "A few ways to wear it." : "A place to begin."}</h2></div>
                <span>{results.recommendations.length || results.closestOptions.length} IDEAS</span>
              </div>
              {results.message && <p className="recommendation-message">{results.message}</p>}
              <div className="recommendation-list">
                {[...results.recommendations, ...results.closestOptions].map((outfit) => {
                  const key = outfit.itemIds.join("-");
                  return (
                    <OutfitCard
                      key={key}
                      outfit={outfit}
                      wardrobe={wardrobe}
                      token={token}
                      outfitKey={key}
                      occasion={occasionLabel}
                      selectedItems={selectedItems[key] || {}}
                      onChangeItem={(outfitKey, category, item) => {
                        setSelectedItems((current) => ({
                          ...current,
                          [outfitKey]: { ...current[outfitKey], [category]: item },
                        }));
                      }}
                      onFindAlternatives={requestAlternatives}
                      onSave={(payload) => saveRecommendedOutfit(key, payload, occasionLabel)}
                      saving={savingKey === key}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="saved-outfits-section">
        <div className="section-heading saved-heading">
          <div><p className="eyebrow">KEEP THE GOOD ONES</p><h2>My saved outfits</h2></div>
          <span className="section-index">{savedOutfits.length} SAVED</span>
        </div>
        {savedOutfits.length ? (
          <div className="saved-outfit-grid">
            {savedOutfits.map((outfit) => (
              <SavedOutfitCard
                key={outfit._id}
                outfit={outfit}
                token={token}
                onDeleted={async () => {
                  try {
                    await loadSavedOutfits();
                  } catch (requestError) {
                    setError(requestError.message);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState eyebrow="YOUR OUTFIT ARCHIVE" title="Your next favourite, saved.">
            When you find a combination you love, save it here for later.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
