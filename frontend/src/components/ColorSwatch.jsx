const SWATCH_COLORS = {
  black: "#29262e",
  white: "#fffdfa",
  ivory: "#f8f5f0",
  beige: "#d9c9b5",
  gray: "#8f8c91",
  brown: "#795b49",
  navy: "#343e5a",
  blue: "#7896bd",
  lavender: "#bca9cc",
  pink: "#d9a6a0",
  red: "#b94f58",
  green: "#829779",
  yellow: "#e5cb75",
  orange: "#dc936b",
  purple: "#8f76a8",
};

export default function ColorSwatch({ color, label }) {
  const swatch = SWATCH_COLORS[String(color || "").toLowerCase()];
  return (
    <span
      className={`color-swatch${swatch === "#fffdfa" || swatch === "#f8f5f0" ? " is-light" : ""}`}
      style={swatch ? { "--swatch-color": swatch } : undefined}
      aria-label={label || color || "No colour"}
      title={label || color}
    />
  );
}
