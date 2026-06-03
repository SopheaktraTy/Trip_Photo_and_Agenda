"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function InvitationCard() {
  const cardRef = useRef(null);

  useEffect(() => {
    function handleMouseMove(e) {
      const card = cardRef.current;
      if (!card) return;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      card.style.transform = `translate(${dx * 6}px, ${dy * 4}px) rotateX(${-dy * 1.5}deg) rotateY(${dx * 1.5}deg)`;
    }

    function handleMouseLeave() {
      const card = cardRef.current;
      if (card) {
        card.style.transform = "";
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", (e) => {
      if (e.toElement === null && e.fromElement === null) {
        handleMouseLeave();
      }
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="inv-card" ref={cardRef}>
      <p className="inv-card-heading">Shared Contribution</p>

      <div className="inv-price-block">
        <span className="inv-price-sup">$</span>
        <span className="inv-price-amount">15</span>
      </div>
      <p className="inv-price-label">per person &nbsp;·&nbsp; includes</p>

      <div className="inv-includes">
        <span className="inv-include-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}>
            <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
          </svg>
          Group Dinner
        </span>
        <span className="inv-include-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          House Rental
        </span>
      </div>

      <div className="inv-divider"></div>

      {/* Self-responsibility note */}
      <div className="inv-note">
        <div className="inv-note-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "15px", height: "15px" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="inv-note-text">
          <strong>Your own responsibility</strong>
          <p>
            All other expenses — transportation, fuel, personal food, drinks, activities, entrance fees, and any
            personal spending — are managed individually by each participant.
          </p>
        </div>
      </div>
    </div>
  );
}
