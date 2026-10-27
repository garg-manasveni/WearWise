import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ColorSwatch from "../components/ColorSwatch.jsx";
import { COLORS, COMFORT_PREFERENCES, STYLES } from "../constants/styleOptions.js";

const EMPTY_PROFILE = {
  preferredStyles: [],
  favoriteColors: [],
  avoidedColors: [],
  comfortPreferences: [],
  fitPreference: "",
  heightCm: "",
  complexionPreference: "",
  undertonePreference: "",
  stylingNotes: "",
};

function ChoiceList({ label, options, selected, onChange, renderOption }) {
  return (
    <fieldset className="profile-choice-group">
      <legend>{label}</legend>
      <div className="profile-choice-list">
        {options.map((option) => (
          <label className="profile-check" key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(selected.includes(option)
                ? selected.filter((item) => item !== option)
                : [...selected, option])}
            />
            {renderOption?.(option)}
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function StyleProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const result = await api.getStyleProfile(token);
        if (result.profile) {
          setProfile({ ...EMPTY_PROFILE, ...result.profile, heightCm: result.profile.heightCm ?? "" });
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function updateList(field, values) {
    setProfile((current) => ({ ...current, [field]: values }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (profile.heightCm !== "" && (Number(profile.heightCm) < 80 || Number(profile.heightCm) > 250)) {
      setError("Height is optional. If you enter it, use a value between 80 and 250 cm.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await api.saveStyleProfile({
        ...profile,
        heightCm: profile.heightCm === "" ? null : Number(profile.heightCm),
      }, token);
      setProfile({ ...EMPTY_PROFILE, ...result.profile, heightCm: result.profile.heightCm ?? "" });
      setNotice("Your style notes are saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="feature-loading" aria-live="polite"><span className="loading-mark" /><p>Gathering your style notes…</p></div>;
  }

  return (
    <div className="profile-page">
      <section className="feature-page-heading">
        <div>
          <p className="eyebrow">A LITTLE MORE YOU</p>
          <h1>My style <em>profile.</em></h1>
          <p className="intro-copy">A few preferences help WearWise make more personal suggestions. Edit them whenever you like.</p>
        </div>
        <span className="profile-mark" aria-hidden="true">W</span>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <form className="profile-form" onSubmit={submit}>
        <section className="profile-section">
          <div className="profile-section-heading"><span>01</span><div><h2>Your point of view</h2><p>Choose as many styles as feel like you.</p></div></div>
          <ChoiceList label="Styles you enjoy" options={STYLES} selected={profile.preferredStyles} onChange={(values) => updateList("preferredStyles", values)} />
        </section>

        <section className="profile-section">
          <div className="profile-section-heading"><span>02</span><div><h2>Your colour story</h2><p>Favourites are suggestions, never rules.</p></div></div>
          <ChoiceList label="Colours you love" options={COLORS} selected={profile.favoriteColors} onChange={(values) => updateList("favoriteColors", values)} renderOption={(color) => <ColorSwatch color={color} />} />
          <ChoiceList label="Colours you prefer to avoid" options={COLORS} selected={profile.avoidedColors} onChange={(values) => updateList("avoidedColors", values)} renderOption={(color) => <ColorSwatch color={color} />} />
        </section>

        <section className="profile-section">
          <div className="profile-section-heading"><span>03</span><div><h2>Comfort and fit</h2><p>Tell us what makes a piece feel good to wear.</p></div></div>
          <ChoiceList label="Comfort preferences" options={COMFORT_PREFERENCES} selected={profile.comfortPreferences} onChange={(values) => updateList("comfortPreferences", values)} />
          <label className="field-label profile-fit">Preferred fit
            <select name="fitPreference" value={profile.fitPreference} onChange={updateField}>
              <option value="">No preference</option>
              <option value="relaxed">Relaxed</option>
              <option value="regular">Regular</option>
              <option value="tailored">Tailored</option>
              <option value="oversized">Oversized</option>
            </select>
          </label>
        </section>

        <section className="profile-section optional-preferences">
          <div className="profile-section-heading"><span>04</span><div><h2>Optional colour context</h2><p>Only share what you’re comfortable sharing; skip these fields if you prefer.</p></div></div>
          <div className="profile-optional-grid">
            <label className="field-label">Height in centimetres <span className="field-optional">optional</span>
              <input type="number" name="heightCm" min="80" max="250" value={profile.heightCm} onChange={updateField} placeholder="e.g. 165" />
            </label>
            <label className="field-label">Self-described complexion preference <span className="field-optional">optional</span>
              <select name="complexionPreference" value={profile.complexionPreference} onChange={updateField}>
                <option value="">Prefer not to specify</option><option value="fair">Fair</option><option value="light">Light</option><option value="medium">Medium</option><option value="deep">Deep</option>
              </select>
            </label>
            <label className="field-label">Self-described undertone preference <span className="field-optional">optional</span>
              <select name="undertonePreference" value={profile.undertonePreference} onChange={updateField}>
                <option value="">Prefer not to specify</option><option value="warm">Warm</option><option value="cool">Cool</option><option value="neutral">Neutral</option><option value="olive">Olive</option>
              </select>
            </label>
          </div>
          <p className="profile-privacy-note">These are optional styling notes only. WearWise never infers complexion from photos or treats it as a rule—every colour and style is for everyone. These preferences don’t exclude colours from outfit suggestions.</p>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading"><span>05</span><div><h2>Anything else?</h2><p>Add a note you’d like your stylist to remember.</p></div></div>
          <label className="field-label">Styling preferences <span className="field-optional">optional · 500 characters</span>
            <textarea name="stylingNotes" value={profile.stylingNotes} onChange={updateField} maxLength={500} rows={3} placeholder="I like layers, prefer lower heels…" />
          </label>
        </section>

        <div className="profile-submit-row">
          <button className="button button-primary" type="submit" disabled={isSaving}>{isSaving ? "Saving your style…" : "Save style profile"}<span aria-hidden="true">↗</span></button>
          <span>Your preferences are private to your account.</span>
        </div>
      </form>
    </div>
  );
}
