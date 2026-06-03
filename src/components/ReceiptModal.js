"use client";

import { useState } from "react";

export default function ReceiptModal({ receiptUrl, name, onClose }) {
  const [imageError, setImageError] = useState(false);

  if (!receiptUrl) return null;

  return (
    <div id="receiptModal" className="modal show" onClick={(e) => {
      if (e.target.id === "receiptModal") onClose();
    }}>
      <div className="close-modal" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <div className="modal-content" id="modalContent">
        <div className="receipt-container" style={{ display: "block" }}>
          {!imageError ? (
            <img
              src={receiptUrl}
              alt={`${name} Receipt`}
              className="receipt-img"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="receipt-placeholder"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                background: "#f9fafb",
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                color: "#475569",
                fontFamily: "'Karla', sans-serif",
                textAlign: "center",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  width: "48px",
                  height: "48px",
                  marginBottom: "12px",
                  color: "#94a3b8",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px", fontFamily: "'Outfit', sans-serif", display: "block" }}>
                No Receipt Image Yet
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", maxWidth: "240px", lineHeight: 1.5, display: "block" }}>
                The receipt photo will be visible once uploaded to the server.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
