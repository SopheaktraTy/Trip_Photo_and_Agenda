"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PhotoUploadForm from "@/components/PhotoUploadForm";
import PhotoGallery from "@/components/PhotoGallery";
import { supabase, supabaseReady } from "@/lib/supabase";

export default function PhotoBoothHome() {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("gallery");
  const [particleCount] = useState(Array.from({ length: 24 }));

  const fetchPhotos = useCallback(async () => {
    // Skip fetch entirely if Supabase isn't configured yet
    if (!supabaseReady) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("trip_photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUploadSuccess = useCallback(() => {
    fetchPhotos();
    setActiveView("gallery");
  }, [fetchPhotos]);

  return (
    <div className="pb-root">
      {/* ── Ambient floating orbs ── */}
      <div className="pb-orb pb-orb-1" />
      <div className="pb-orb pb-orb-2" />
      <div className="pb-orb pb-orb-3" />

      {/* ── Floating particles ── */}
      <div className="pb-particles" aria-hidden="true">
        {particleCount.map((_, i) => (
          <span key={i} className="pb-particle" style={{ "--i": i }} />
        ))}
      </div>

      {/* ── Cinematic film-strip top bar ── */}
      <div className="pb-filmstrip" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="pb-film-hole" />
        ))}
      </div>

      {/* ── NAV BAR ── */}
      <nav className="pb-nav">
        <div className="pb-nav-brand">
          <span className="pb-nav-logo">📸</span>
          <span className="pb-nav-title">KompotTrip</span>
          <span className="pb-nav-dot" />
          <span className="pb-nav-sub">Photo Booth</span>
        </div>
        <div className="pb-nav-actions">
          <Link href="/agenda" className="pb-nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            View Agenda
          </Link>
        </div>
      </nav>

      {/* ── Supabase NOT configured warning ── */}
      {!supabaseReady && (
        <div className="pb-setup-banner" role="alert">
          <div className="pb-setup-banner-inner">
            <span className="pb-setup-icon">⚙️</span>
            <div>
              <strong>Supabase not connected yet.</strong>
              <p>
                Open <code>.env.local</code> in the project root and replace the placeholder values
                with your real Supabase <strong>Project URL</strong> and <strong>Anon Key</strong>,
                then restart the dev server.
              </p>
            </div>
            <Link href="/agenda" className="pb-setup-link">
              View Agenda Instead →
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <header className="pb-hero">
        <div className="pb-hero-inner">
          <div className="pb-hero-badge">
            <span className="pb-badge-dot" />
            May 23–24, 2026 · Kampot Province
          </div>
          <h1 className="pb-hero-title">
            Our Road Trip
            <br />
            <em className="pb-hero-em">Memories</em>
          </h1>
          <p className="pb-hero-desc">
            A shared photo album for the Kompot crew — upload your best shots, browse
            everyone&apos;s moments, and relive the adventure together.
          </p>
          <div className="pb-hero-stats">
            <div className="pb-stat">
              <span className="pb-stat-num">{isLoading ? "—" : photos.length}</span>
              <span className="pb-stat-label">Memories</span>
            </div>
            <div className="pb-stat-divider" />
            <div className="pb-stat">
              <span className="pb-stat-num">15</span>
              <span className="pb-stat-label">Travelers</span>
            </div>
            <div className="pb-stat-divider" />
            <div className="pb-stat">
              <span className="pb-stat-num">2</span>
              <span className="pb-stat-label">Days</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="pb-main" role="main">
        {/* ── Mobile View Toggle ── */}
        <div className="pb-view-toggle" role="tablist" aria-label="Switch view">
          <button
            role="tab"
            id="tab-gallery"
            aria-selected={activeView === "gallery"}
            aria-controls="panel-gallery"
            className={`pb-toggle-btn ${activeView === "gallery" ? "active" : ""}`}
            onClick={() => setActiveView("gallery")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Gallery
            {!isLoading && photos.length > 0 && (
              <span className="pb-toggle-count">{photos.length}</span>
            )}
          </button>
          <button
            role="tab"
            id="tab-upload"
            aria-selected={activeView === "upload"}
            aria-controls="panel-upload"
            className={`pb-toggle-btn ${activeView === "upload" ? "active" : ""}`}
            onClick={() => setActiveView("upload")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Share Media
          </button>
        </div>

        {/* ── Two-column desktop layout ── */}
        <div className="pb-content-grid">
          {/* LEFT: Upload Panel */}
          <aside
            id="panel-upload"
            role="tabpanel"
            aria-labelledby="tab-upload"
            className={`pb-upload-col ${activeView === "upload" ? "mobile-visible" : ""}`}
          >
            <PhotoUploadForm onUploadSuccess={handleUploadSuccess} disabled={!supabaseReady} />
          </aside>

          {/* RIGHT: Gallery Panel */}
          <section
            id="panel-gallery"
            role="tabpanel"
            aria-labelledby="tab-gallery"
            className={`pb-gallery-col ${activeView === "gallery" ? "mobile-visible" : ""}`}
          >
            <PhotoGallery photos={photos} isLoading={isLoading} onRefresh={fetchPhotos} />
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="pb-footer">
        <span className="pb-footer-text">Kompot Road Trip · May 2026 · Made with ❤️</span>
      </footer>
    </div>
  );
}
