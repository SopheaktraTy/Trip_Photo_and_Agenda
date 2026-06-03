"use client";

import { useState } from "react";

const isVideoUrl = (url) => {
  if (!url) return false;
  return /\.(mp4|mov|webm|ogg|avi|mkv)(\?.*)?$/i.test(url);
};

export default function PhotoGallery({ photos, isLoading, onRefresh }) {
  const [selected, setSelected] = useState(null);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  };

  const videoCount = photos.filter((p) => p.file_type === "video" || isVideoUrl(p.photo_url)).length;
  const imageCount = photos.length - videoCount;

  if (isLoading) {
    return (
      <div className="gallery-container">
        <div className="gallery-loading">
          <div className="spinner" />
          <p>Loading Trip Moments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      {/* Header */}
      <div className="gallery-header">
        <div>
          <h3>Road Trip Memories</h3>
          {photos.length > 0 && (
            <div className="gallery-type-badges">
              {imageCount > 0 && (
                <span className="gallery-count-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  {imageCount} photo{imageCount !== 1 ? "s" : ""}
                </span>
              )}
              {videoCount > 0 && (
                <span className="gallery-count-badge badge-video">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  {videoCount} video{videoCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
        {onRefresh && (
          <button className="gallery-refresh-btn" onClick={onRefresh} aria-label="Refresh gallery">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Empty state */}
      {photos.length === 0 ? (
        <div className="gallery-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          <p>No memories posted yet.</p>
          <p className="gallery-empty-hint">Be the first to share a photo or video from the Kompot trip!</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((item) => {
            const isVid = item.file_type === "video" || isVideoUrl(item.photo_url);
            return (
              <div
                key={item.id}
                className={`photo-card ${isVid ? "video-card" : ""}`}
                onClick={() => setSelected(item)}
                role="button"
                tabIndex={0}
                aria-label={`${isVid ? "Video" : "Photo"} by ${item.uploader}`}
                onKeyDown={(e) => e.key === "Enter" && setSelected(item)}
              >
                {isVid ? (
                  <>
                    <video src={item.photo_url} muted playsInline preload="metadata" className="card-video-preview" />
                    <div className="video-play-badge">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <img src={item.photo_url} alt={item.caption || `Trip photo by ${item.uploader}`} loading="lazy" />
                )}
                <div className="photo-overlay">
                  <div className="photo-meta">
                    <span className="photo-uploader">By {item.uploader}</span>
                    <span className="photo-date">{formatDate(item.created_at)}</span>
                  </div>
                  {item.caption && <p className="photo-caption">{item.caption}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / video player */}
      {selected && (() => {
        const isVid = selected.file_type === "video" || isVideoUrl(selected.photo_url);
        return (
          <div
            className="lightbox-overlay"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={isVid ? "Video player" : "Photo viewer"}
          >
            <button className="lightbox-close" onClick={() => setSelected(null)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              {isVid ? (
                <video
                  src={selected.photo_url}
                  controls
                  autoPlay
                  playsInline
                  className="lightbox-video"
                />
              ) : (
                <img src={selected.photo_url} alt={selected.caption || "Trip memory"} />
              )}
              <div className="lightbox-info">
                <div className="lightbox-meta-row">
                  <span className={`uploader-badge ${isVid ? "badge-vid-type" : ""}`}>
                    {isVid ? "🎬" : "📷"} By {selected.uploader}
                  </span>
                  <span className="date-badge">{formatDate(selected.created_at)}</span>
                </div>
                {selected.caption && (
                  <p className="lightbox-caption">&ldquo;{selected.caption}&rdquo;</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
