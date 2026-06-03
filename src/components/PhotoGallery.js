"use client";

import { useState, useMemo, useEffect, useRef } from "react";

const isVideoUrl = (url) => {
  if (!url) return false;
  return /\.(mp4|mov|webm|ogg|avi|mkv)(\?.*)?$/i.test(url);
};

const isVideoItem = (item) =>
  item.file_type === "video" || isVideoUrl(item.photo_url);

// Append #t=0.5 so mobile browsers render a real thumbnail frame
const videoSrc = (url) => (url ? `${url}#t=0.5` : url);

const PER_PAGE_OPTIONS = [10, 15, 20];

// Smart page number array: [1, "...", 4, 5, 6, "...", 12]
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export default function PhotoGallery({ photos, isLoading, onRefresh }) {
  const [selected,   setSelected]   = useState(null);
  const [activeTab,  setActiveTab]  = useState("all");
  const [perPage,    setPerPage]    = useState(10);
  const [page,       setPage]       = useState(1);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        setIsPerPageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  };

  const videoCount = photos.filter(isVideoItem).length;
  const imageCount = photos.length - videoCount;

  const filtered = useMemo(() => {
    if (activeTab === "photos") return photos.filter((p) => !isVideoItem(p));
    if (activeTab === "videos") return photos.filter(isVideoItem);
    return photos;
  }, [photos, activeTab]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage    = Math.min(page, totalPages);
  const startIdx    = (safePage - 1) * perPage;
  const paginated   = filtered.slice(startIdx, startIdx + perPage);
  const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
  const showingTo   = Math.min(startIdx + perPage, filtered.length);
  const pageNumbers = getPageNumbers(safePage, totalPages);

  const switchTab    = (tab) => { setActiveTab(tab); setPage(1); };
  const switchPerPage = (n)  => { setPerPage(n);    setPage(1); };

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

      {/* ── Header row ── */}
      <div className="gallery-header">
        <div>
          <h3>Road Trip Memories</h3>
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

      {/* ── Tabs + per-page row ── */}
      <div className="gallery-toolbar">
        {/* Tabs */}
        <div className="gallery-tabs" role="tablist" aria-label="Filter media type">
          {[
            {
              id: "all", label: "All", count: photos.length,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
            },
            {
              id: "photos", label: "Photos", count: imageCount,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              ),
            },
            {
              id: "videos", label: "Videos", count: videoCount,
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`gallery-tab-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => switchTab(tab.id)}
            >
              {tab.icon}
              <span className="tab-label">{tab.label}</span>
              <span className="gallery-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="gallery-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>No {activeTab === "all" ? "memories" : activeTab} yet.</p>
          <p className="gallery-empty-hint">
            {activeTab === "videos"
              ? "No videos uploaded yet — be the first!"
              : activeTab === "photos"
              ? "No photos uploaded yet — be the first!"
              : "Be the first to share a photo or video from the Kompot trip!"}
          </p>
        </div>
      ) : (
        <>
          {/* ── Grid ── */}
          <div className="photo-grid">
            {paginated.map((item) => {
              const isVid = isVideoItem(item);
              return (
                <div
                  key={item.id}
                  className={`photo-card${isVid ? " video-card" : ""}`}
                  onClick={() => setSelected(item)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${isVid ? "Video" : "Photo"} by ${item.uploader}`}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(item)}
                >
                  {isVid ? (
                    <>
                      <video
                        src={videoSrc(item.photo_url)}
                        muted playsInline preload="metadata"
                        className="card-video-preview"
                      />
                      <div className="video-play-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <span className="video-type-pill">VIDEO</span>
                    </>
                  ) : (
                    <img
                      src={item.photo_url}
                      alt={item.caption || `Trip photo by ${item.uploader}`}
                      loading="lazy"
                    />
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

          {/* ── Pagination bar ── */}
          <div className="gallery-pagination">
            <span className="gallery-showing">
              {showingFrom}–{showingTo} of {filtered.length}
            </span>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn pagination-arrow"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="pagination-text" style={{ marginLeft: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prev</span>
                </button>

                {pageNumbers.map((n, i) =>
                  n === "..." ? (
                    <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={n}
                      className={`pagination-btn pagination-num${safePage === n ? " active" : ""}`}
                      onClick={() => setPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={safePage === n ? "page" : undefined}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  className="pagination-btn pagination-arrow"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                >
                  <span className="pagination-text" style={{ marginRight: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Per-page custom selector moved to bottom */}
            <div className="per-page-wrapper" role="group" aria-label="Items per page">
              <span className="per-page-label">Show</span>
              <div 
                className={`custom-select-wrap reverse ${isPerPageOpen ? "open" : ""}`}
                ref={perPageRef}
                style={{ width: "fit-content", minWidth: "54px" }}
              >
                <div 
                  className="custom-select-trigger" 
                  onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                  style={{ padding: "6px 8px", fontSize: "12.5px", minHeight: "30px", justifyContent: "center", gap: "6px" }}
                >
                  <span className="select-value">{perPage}</span>
                  <svg className="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px", margin: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                {isPerPageOpen && (
                  <ul className="custom-select-list" style={{ padding: "4px 0", minWidth: "100%", textAlign: "center" }}>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <li
                        key={n}
                        className={`custom-select-option ${perPage === n ? "selected" : ""}`}
                        style={{ padding: "7px 10px", fontSize: "12.5px", justifyContent: "center" }}
                        onClick={() => {
                          switchPerPage(n);
                          setIsPerPageOpen(false);
                        }}
                      >
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Lightbox ── */}
      {selected && (() => {
        const isVid = isVideoItem(selected);
        return (
          <div
            className="lightbox-overlay"
            onClick={() => setSelected(null)}
            role="dialog" aria-modal="true"
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
                  controls autoPlay playsInline preload="auto"
                  crossOrigin="anonymous"
                  className="lightbox-video"
                />
              ) : (
                <img src={selected.photo_url} alt={selected.caption || "Trip memory"} />
              )}
              <div className="lightbox-info">
                <div className="lightbox-meta-row">
                  <span className={`uploader-badge${isVid ? " badge-vid-type" : ""}`}>
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
