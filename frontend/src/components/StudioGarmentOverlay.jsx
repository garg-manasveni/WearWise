import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";

export default function StudioGarmentOverlay({
  item,
  token,
  position,
  frameRef,
  onPositionChange,
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    let active = true;
    let currentUrl = "";
    setImageUrl("");
    setFailed(false);
    api.getWardrobeImage(item._id, token)
      .then((blob) => {
        if (!active) return;
        currentUrl = URL.createObjectURL(blob);
        setImageUrl(currentUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [item._id, token]);

  function startDrag(event) {
    if (!frameRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = frameRef.current.getBoundingClientRect();
    drag.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  function moveDrag(event) {
    if (!drag.current) return;
    const nextX = drag.current.startX
      + ((event.clientX - drag.current.pointerX) / drag.current.width) * 100;
    const nextY = drag.current.startY
      + ((event.clientY - drag.current.pointerY) / drag.current.height) * 100;
    onPositionChange({
      ...position,
      x: Math.max(4, Math.min(96, nextX)),
      y: Math.max(4, Math.min(96, nextY)),
    });
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <button
      className={`studio-garment-overlay${failed ? " is-unavailable" : ""}`}
      type="button"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.scale}%`,
      }}
      aria-label={`Drag to position ${item.name}`}
      title={`Drag to position ${item.name}`}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      {imageUrl && !failed
        ? <img src={imageUrl} alt={item.name} draggable="false" onError={() => setFailed(true)} />
        : <span>{failed ? "Photo unavailable" : "Loading photo…"}</span>}
      <span className="studio-overlay-name">{item.name}</span>
    </button>
  );
}
