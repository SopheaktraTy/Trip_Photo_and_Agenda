"use client";

import { useState } from "react";
import Link from "next/link";
import DinnerTab from "@/components/DinnerTab";
import AgendaTab from "@/components/AgendaTab";
import ReceiptModal from "@/components/ReceiptModal";

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState("dinner");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptOwner, setReceiptOwner] = useState("");

  const handleOpenReceipt = (receiptUrl, name) => {
    setSelectedReceipt(receiptUrl);
    setReceiptOwner(name);
    document.body.style.overflow = "hidden";
  };

  const handleCloseReceipt = () => {
    setSelectedReceipt(null);
    setReceiptOwner("");
    document.body.style.overflow = "auto";
  };

  return (
    <div className="agn-root">
      {/* Ambient orbs */}
      <div className="arc-orb arc-orb-1" />
      <div className="arc-orb arc-orb-2" />

      {/* Film strip */}
      <div className="arc-filmstrip" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="arc-film-hole" />
        ))}
      </div>

      {/* Nav */}
      <nav className="arc-nav">
        <Link href="/" className="arc-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Photo Booth
        </Link>
        <Link href="/" className="arc-nav-tag" style={{ textDecoration: "none" }}>
          <span className="arc-nav-dot" />
          Photo Booth →
        </Link>
      </nav>

      {/* Hero */}
      <header className="agn-hero">
        <div className="arc-kicker">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 11l19-9-9 19-2-8-8-2z" />
          </svg>
          Road Trip · May 23–24, 2026
        </div>
        <h1 className="agn-hero-title">
          Kompot <em className="arc-title-em">Province</em>
        </h1>
        <p className="agn-hero-sub">Agenda · Budget · Payments</p>
      </header>

      {/* Tab navigation */}
      <div className="agn-tabs-nav" role="tablist" aria-label="Trip sections">
        <button
          role="tab"
          id="tab-dinner"
          aria-selected={activeTab === "dinner"}
          aria-controls="panel-dinner"
          className={`agn-tab-btn ${activeTab === "dinner" ? "active" : ""}`}
          onClick={() => setActiveTab("dinner")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
          </svg>
          Dinner &amp; House Rent
        </button>
        <button
          role="tab"
          id="tab-agenda"
          aria-selected={activeTab === "agenda"}
          aria-controls="panel-agenda"
          className={`agn-tab-btn ${activeTab === "agenda" ? "active" : ""}`}
          onClick={() => setActiveTab("agenda")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 20l-5-5 5-5M20 20l-5-5 5-5" />
          </svg>
          Road Trip Agenda
        </button>
      </div>

      {/* Tab content */}
      <div id="panel-dinner" role="tabpanel" aria-labelledby="tab-dinner" className={`agn-panel ${activeTab === "dinner" ? "active" : ""}`}>
        <DinnerTab onViewReceipt={handleOpenReceipt} />
      </div>
      <div id="panel-agenda" role="tabpanel" aria-labelledby="tab-agenda" className={`agn-panel ${activeTab === "agenda" ? "active" : ""}`}>
        <AgendaTab />
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receiptUrl={selectedReceipt}
          name={receiptOwner}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
}
