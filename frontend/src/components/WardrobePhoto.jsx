import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function WardrobePhoto({ item, token, alt = "", className = "" }) {
  const [objectUrl, setObjectUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let currentUrl = "";
    setObjectUrl("");
    setFailed(false);
    api.getWardrobeImage(item._id, token)
      .then((blob) => {
        if (!active) return;
        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [item._id, token]);

  return objectUrl && !failed
    ? <img className={className} src={objectUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    : <div className={`missing-image ${className}`} role="img" aria-label={`${alt || item.name} photo unavailable`}>
      <span>{failed ? "PHOTO\nNOT AVAILABLE" : "LOADING\nPHOTO"}</span>
    </div>;
}
