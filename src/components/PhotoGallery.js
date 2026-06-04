"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

const isVideoUrl = (url) => {
  if (!url) return false;
  return /\.(mp4|mov|webm|ogg|avi|mkv)(\?.*)?$/i.test(url);
};

const isVideoItem = (item) =>
  item.file_type === "video" || isVideoUrl(item.photo_url);

// Append #t=0.5 so mobile browsers render a real thumbnail frame
const videoSrc = (url) => (url ? `${url}#t=0.5` : url);

const PER_PAGE_OPTIONS = [10, 15, 20];

const SLIDESHOW_INTERVAL = 4000; // ms per slide

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
  const [selected,      setSelected]      = useState(null);
  const [activeTab,     setActiveTab]     = useState("all");
  const [perPage,       setPerPage]       = useState(10);
  const [page,          setPage]          = useState(1);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [fabOpen,       setFabOpen]       = useState(false);
  const perPageRef = useRef(null);

  // ── Delete state ─────────────────────────────────────────────────────────
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isDeleting, setIsDeleting]       = useState(false);

  // ── Slideshow state ──────────────────────────────────────────────────────
  const [slideshowOpen,    setSlideshowOpen]    = useState(false);
  const [slideshowOrder,   setSlideshowOrder]   = useState([]);
  const [slideshowIdx,     setSlideshowIdx]     = useState(0);
  const [slideshowPlaying, setSlideshowPlaying] = useState(true);
  const [slideshowProg,    setSlideshowProg]    = useState(0);   // 0-100
  const slideshowTimer  = useRef(null);
  const progressTimer   = useRef(null);

  // ── Random memory toast ──────────────────────────────────────────────────
  const [randomToast, setRandomToast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Close per-page dropdown on outside click ─────────────────────────────
  useEffect(() => {
    function handleClickOutside(event) {
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        setIsPerPageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Keyboard: Escape closes slideshow / lightbox ─────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setSlideshowOpen(false);
        setSelected(null);
      }
      if (slideshowOpen) {
        if (e.key === "ArrowRight") advanceSlide(1);
        if (e.key === "ArrowLeft")  advanceSlide(-1);
        if (e.key === " ") { e.preventDefault(); setSlideshowPlaying(p => !p); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideshowOpen]);

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

  const switchTab     = (tab) => { setActiveTab(tab); setPage(1); };
  const switchPerPage = (n)   => { setPerPage(n);     setPage(1); };

  // ── Random Memory ─────────────────────────────────────────────────────────
  const openRandomMemory = () => {
    if (!filtered.length) return;
    const rand = filtered[Math.floor(Math.random() * filtered.length)];
    setSelected(rand);
    setRandomToast(true);
    setTimeout(() => setRandomToast(false), 2200);
  };

  // ── Slideshow logic ───────────────────────────────────────────────────────
  const advanceSlide = useCallback((dir) => {
    setSlideshowIdx(i => {
      let next = i + dir;
      if (next < 0) next = slideshowOrder.length - 1;
      if (next >= slideshowOrder.length) next = 0;
      return next;
    });
    setSlideshowProg(0);
  }, [slideshowOrder.length]);

  const startSlideshow = () => {
    if (filtered.length === 0) return;
    // Create a shuffled array of indices
    let order = Array.from({ length: filtered.length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setSlideshowOrder(order);
    setSlideshowIdx(0);
    setSlideshowOpen(true);
    setSlideshowPlaying(true);
    setSlideshowProg(0);
  };

  // Auto-advance timer
  useEffect(() => {
    if (!slideshowOpen) return;
    if (!slideshowPlaying) {
      clearInterval(slideshowTimer.current);
      clearInterval(progressTimer.current);
      return;
    }
    // Progress bar tick (every 40ms → 100 steps over 4 s)
    setSlideshowProg(0);
    const STEP  = 40;
    const STEPS = SLIDESHOW_INTERVAL / STEP;
    let count = 0;
    progressTimer.current = setInterval(() => {
      count++;
      setSlideshowProg(Math.min(100, (count / STEPS) * 100));
    }, STEP);

    slideshowTimer.current = setTimeout(() => {
      advanceSlide(1);
    }, SLIDESHOW_INTERVAL);

    return () => {
      clearTimeout(slideshowTimer.current);
      clearInterval(progressTimer.current);
    };
  }, [slideshowOpen, slideshowPlaying, slideshowIdx, advanceSlide]);

  const closeSlideshow = () => {
    setSlideshowOpen(false);
    clearTimeout(slideshowTimer.current);
    clearInterval(progressTimer.current);
  };

  const confirmDelete = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("trip_photos")
        .delete()
        .eq("id", photoToDelete.id);
      
      if (error) throw error;
      
      setPhotoToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to delete photo:", err);
      alert("Failed to delete photo. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="gallery-container">
        <div className="gallery-loading">
          <div className="spinner" />
          <p>Loading Trip Moments…</p>
        </div>
      </div>
    );
  }

  const slideshowItem = (slideshowOrder.length > 0 && slideshowOrder[slideshowIdx] !== undefined)
    ? filtered[slideshowOrder[slideshowIdx]]
    : null;

  return (
    <div className="gallery-container">

      {/* ── Random memory toast ── */}
      {randomToast && (
        <div className="random-toast" aria-live="polite">
          🎲 Surprise memory!
        </div>
      )}

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
                    <button 
                      className="delete-photo-btn"
                      onClick={(e) => { e.stopPropagation(); setPhotoToDelete(item); }}
                      aria-label="Delete memory"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                    <div className="photo-meta">
                      <span className="photo-date">{formatDate(item.created_at)}</span>
                      <span className="photo-uploader">By {item.uploader}</span>
                    </div>
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

            {/* Per-page custom selector */}
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
                  style={{ padding: "6px 12px", fontSize: "12.5px", minHeight: "30px", justifyContent: "center" }}
                >
                  <span className="select-value">{perPage}</span>
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

      {/* ── Floating Speed-Dial FAB (bottom-right) ── */}
      {filtered.length > 0 && (
        <div className={`gallery-fab-group${fabOpen ? " fab-open" : ""}`} aria-label="Quick actions">

          {/* Sub-button: Surprise Me */}
          <div className={`fab-sub-wrap${fabOpen ? " fab-sub-visible" : ""}`} style={{ "--fab-delay": "0.05s" }}>
            <button
              className="fab-btn fab-surprise"
              onClick={() => { openRandomMemory(); setFabOpen(false); }}
              aria-label="Surprise Me"
            >
              <span style={{ fontSize: "22px", lineHeight: 1 }}>🎲</span>
            </button>
            <span className="fab-sub-label">Surprise Me</span>
          </div>

          {/* Sub-button: Play Memories */}
          <div className={`fab-sub-wrap${fabOpen ? " fab-sub-visible" : ""}`} style={{ "--fab-delay": "0s" }}>
            <button
              className="fab-btn fab-play"
              onClick={() => { startSlideshow(); setFabOpen(false); }}
              aria-label="Play Memories"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <span className="fab-sub-label">Play</span>
          </div>

          {/* Main trigger button */}
          <button
            className="fab-btn fab-main"
            onClick={() => setFabOpen(o => !o)}
            aria-label={fabOpen ? "Close actions" : "Open actions"}
            aria-expanded={fabOpen}
          >
            <span className={`fab-main-icon${fabOpen ? " fab-icon-open" : ""}`}>
              {fabOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              )}
            </span>
          </button>
        </div>
      )}

      {/* ── Lightbox ── */}
      {selected && (() => {
        const isVid = isVideoItem(selected);
        const modal = (
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
        return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
      })()}

      {/* ── Slideshow / Story Mode ── */}
      {slideshowOpen && slideshowItem && (() => {
        const isVid = isVideoItem(slideshowItem);
        const modal = (
          <div 
            className="slideshow-overlay" 
            role="dialog" 
            aria-modal="true" 
            aria-label="Slideshow"
            onClick={closeSlideshow}
          >

            {/* Progress bar */}
            <div className="slideshow-progress-track">
              <div
                className="slideshow-progress-bar"
                style={{ width: `${slideshowPlaying ? slideshowProg : (slideshowProg || 0)}%` }}
              />
            </div>

            {/* Counter + Close */}
            <div className="slideshow-topbar">
              <span className="slideshow-counter">
                {slideshowIdx + 1} / {filtered.length}
              </span>
              <button className="slideshow-close-btn" onClick={closeSlideshow} aria-label="Close slideshow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Main media */}
            <div className="slideshow-media-wrap" key={slideshowIdx}>
              {isVid ? (
                <video
                  src={slideshowItem.photo_url}
                  className="slideshow-media"
                  muted playsInline autoPlay
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img
                  src={slideshowItem.photo_url}
                  alt={slideshowItem.caption || "Trip memory"}
                  className="slideshow-media"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            {/* Info overlay */}
            <div className="slideshow-info">
              <span className="slideshow-uploader">
                {isVid ? "🎬" : "📷"} By {slideshowItem.uploader}
              </span>
              {slideshowItem.caption && (
                <p className="slideshow-caption">&ldquo;{slideshowItem.caption}&rdquo;</p>
              )}
            </div>

            {/* Controls */}
            <div className="slideshow-controls" onClick={(e) => e.stopPropagation()}>
              <button
                className="slideshow-ctrl-btn"
                onClick={() => advanceSlide(-1)}
                aria-label="Previous"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                className="slideshow-ctrl-btn slideshow-play-btn"
                onClick={() => setSlideshowPlaying(p => !p)}
                aria-label={slideshowPlaying ? "Pause" : "Play"}
              >
                {slideshowPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              <button
                className="slideshow-ctrl-btn"
                onClick={() => advanceSlide(1)}
                aria-label="Next"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Tap-zone: left / right sides for prev/next */}
            <div className="slideshow-tap-left"  onClick={(e) => { e.stopPropagation(); advanceSlide(-1); }} aria-label="Previous" role="button" />
            <div className="slideshow-tap-right" onClick={(e) => { e.stopPropagation(); advanceSlide(1); }}  aria-label="Next"     role="button" />
          </div>
        );
        return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
      })()}

      {/* ── Delete Confirmation Modal ── */}
      {photoToDelete && (() => {
        const isVid = isVideoItem(photoToDelete);
        const modal = (
          <div className="delete-modal-overlay" onClick={() => !isDeleting && setPhotoToDelete(null)}>
            <div className="delete-modal-content" onClick={e => e.stopPropagation()}>

              {/* Icon header */}
              <div className="delete-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>

              <h4 className="delete-modal-title">Delete Memory?</h4>
              <p className="delete-modal-desc">This will permanently remove this memory and cannot be undone.</p>

              <div className="delete-preview-box">
                {isVid ? (
                  <video src={videoSrc(photoToDelete.photo_url)} muted playsInline className="delete-preview-media" />
                ) : (
                  <img src={photoToDelete.photo_url} alt="Preview" className="delete-preview-media" />
                )}
                <div className="delete-preview-overlay">
                  <span style={{fontSize: '11px', fontWeight: 'bold', color: '#fff'}}>{isVid ? "🎬" : "📷"} By {photoToDelete.uploader}</span>
                </div>
              </div>

              <div className="delete-modal-actions">
                <button className="delete-cancel-btn" onClick={() => setPhotoToDelete(null)} disabled={isDeleting}>Cancel</button>
                <button className="delete-confirm-btn" onClick={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:'13px',height:'13px',animation:'spin 0.8s linear infinite'}}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Deleting…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'13px',height:'13px'}}>
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
        return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
      })()}
    </div>
  );
}
