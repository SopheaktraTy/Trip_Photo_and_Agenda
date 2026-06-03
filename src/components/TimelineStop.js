"use client";

import { useState } from "react";

export default function TimelineStop({ stop }) {
  const [activeBfast, setActiveBfast] = useState("bfast1");
  const [breakfastImage, setBreakfastImage] = useState("/images/ei_houy.jpg");
  const [imgError, setImgError] = useState(false);

  // If it's a distance badge, render it differently
  if (stop.isDistBadge) {
    return (
      <div className="dist-badge">
        <div className="dist-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {stop.text}
        </div>
      </div>
    );
  }

  const handleBfastSwitch = (panelId, imgPath) => {
    setActiveBfast(panelId);
    setBreakfastImage(imgPath);
    setImgError(false); // Reset error status on change
  };

  // Get corresponding CSS class for different pin types
  const getPinClass = (type) => {
    switch (type) {
      case "sight":
        return "pin-dot sight";
      case "hotel":
        return "pin-dot hotel";
      case "dinner":
        return "pin-dot dinner";
      default:
        return "pin-dot";
    }
  };

  // Get corresponding CSS class for tag types
  const getTagClass = (type) => {
    switch (type) {
      case "hotel":
        return "type-tag tag-hotel";
      case "dinner":
        return "type-tag tag-dinner";
      default:
        return "type-tag tag-sight";
    }
  };

  return (
    <div className={`stop-row ${stop.align || "right"}`}>
      {stop.align === "right" && <div className="stop-spacer"></div>}

      {/* Vertical timeline pin */}
      <div className="stop-pin">
        <div className={getPinClass(stop.type)}></div>
        <div className="pin-line"></div>
      </div>

      <div className="stop-card-wrap">
        <div className="stop-card">
          <div className="card-img">
            {stop.isBreakfast ? (
              !imgError ? (
                <img
                  id="bfast-img"
                  src={breakfastImage}
                  alt={stop.name}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="img-ph">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span>Add photo</span>
                </div>
              )
            ) : stop.image && !imgError ? (
              <img
                src={stop.image}
                alt={stop.name}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="img-ph">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span>Add photo</span>
              </div>
            )}
            <span className={getTagClass(stop.type)}>{stop.tag}</span>
            {stop.time && (
              <span className="time-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                {stop.time}
              </span>
            )}
          </div>

          <div className="card-body">
            <p className="card-name">{stop.name}</p>
            {stop.description && (
              <p className="card-desc" dangerouslySetInnerHTML={{ __html: stop.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            )}

            {/* If breakfast spot with multiple panel options */}
            {stop.isBreakfast && stop.panels && (
              <>
                <div className="bfast-tabs">
                  {stop.panels.map((p) => (
                    <button
                      key={p.id}
                      className={`bfast-tab ${activeBfast === p.id ? "active" : ""}`}
                      onClick={() => handleBfastSwitch(p.id, p.img)}
                    >
                      {p.btnLabel}
                    </button>
                  ))}
                </div>

                {stop.panels.map((p) => (
                  <div
                    key={p.id}
                    className={`bfast-panel ${activeBfast === p.id ? "active" : ""}`}
                    style={{ display: activeBfast === p.id ? "block" : "none" }}
                  >
                    <p className="bfast-label">
                      {p.label.split(" (")[0]} <span>{p.label.includes(" (") ? `(${p.label.split(" (")[1]}` : ""}</span>
                    </p>
                    <p className="bfast-desc" dangerouslySetInnerHTML={{ __html: p.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    {p.mapLink && (
                      <div className="links">
                        <a className="lbtn btn-gm" href={p.mapLink} target="_blank" rel="noopener noreferrer">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                          Google Map
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {stop.mapLink && !stop.isBreakfast && (
              <div className="links">
                <a className="lbtn btn-gm" href={stop.mapLink} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  Google Map
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {stop.align === "left" && <div className="stop-spacer"></div>}
    </div>
  );
}
