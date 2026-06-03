"use client";

import { expenses } from "@/data/expenses";
import { payments, deniedPerson } from "@/data/payments";

export default function DinnerTab({ onViewReceipt }) {
  // Calculate dynamic totals
  const totalEstimated = expenses.reduce((sum, item) => sum + item.amount, 0);
  const paidCount = payments.filter((p) => p.paid).length;
  const totalCollected = payments.reduce((sum, item) => sum + (item.paid ? item.amount : 0), 0);

  return (
    <div className="spend-container">
      {/* ── FRAME 1: TRIP BUDGET & EXPENSES ── */}
      <div className="section-card">
        <div className="spend-header">
          <div className="budget-info">
            <h3>Trip Budget</h3>
            <span className="budget-tag">$15.00 PER PERSON</span>
          </div>
        </div>

        <div className="total-notice" style={{ marginBottom: "24px" }}>
          <div className="total-notice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="total-notice-content">
            <div className="total-notice-title">Price Note</div>
            <div className="total-notice-text">
              Estimated price may change based on the final number of participants.
            </div>
          </div>
        </div>

        <div className="spend-table-wrap">
          <table className="spend-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th>Expense Details</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ color: "var(--muted)", fontFamily: "'Outfit'", fontWeight: 600 }}>
                    {String(idx + 1).padStart(2, "0")}.
                  </td>
                  <td>
                    <div className="exp-info">
                      <div className="exp-name">{item.name}</div>
                      <div className="exp-sub">{item.description}</div>
                    </div>
                  </td>
                  <td className="price">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ borderTop: "2px solid rgba(28, 26, 23, 0.1)" }}>
              <tr>
                <td
                  colSpan="2"
                  style={{
                    textAlign: "right",
                    fontFamily: "'Outfit'",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--jungle)",
                    padding: "24px 16px",
                    letterSpacing: "0.02em",
                  }}
                >
                  TOTAL ESTIMATED
                </td>
                <td
                  className="price"
                  style={{
                    fontSize: "20px",
                    padding: "24px 16px",
                    color: "var(--jungle)",
                    fontWeight: 800,
                  }}
                >
                  ${totalEstimated.toFixed(3)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── FRAME 2: MONEY TRANSFER ── */}
      <div className="section-card payment-section">
        <h4>Money Transfer</h4>
        <p>Scan the code below to contribute to the shared trip fund.</p>

        <div
          style={{
            background: "rgba(143,190,107,0.08)",
            border: "1px dashed rgba(143,190,107,0.35)",
            borderRadius: "16px",
            padding: "16px 24px",
            margin: "12px 0 16px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Lora',serif",
              fontStyle: "italic",
              fontSize: "13.5px",
              color: "var(--jungle)",
              lineHeight: "1.65",
              margin: 0,
              textAlign: "justify",
            }}
          >
            &quot;You&apos;ll spend more on bubble tea this week. Just pay the $15 and come make memories.&quot;
          </p>
        </div>

        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              background: "var(--jungle)",
              color: "var(--lime)",
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              padding: "8px 24px",
              borderRadius: "100px",
              letterSpacing: "0.04em",
              marginBottom: "16px",
            }}
          >
            $15 / Person
          </span>
          <div className="qr-card">
            <img src="/images/QR_Payment.jpg" alt="ABA Payment QR Code" />
          </div>
        </div>

        <div className="imp-note">
          <div className="imp-note-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="imp-note-body">
            <div className="imp-note-title">Important Note</div>
            <p className="imp-note-text">
              ថវិការួមនេះគឺសម្រាប់តែការជួលផ្ទះស្នាក់ និងការចំណាយលើអាហារពេលល្ងាចរួមគ្នាដែលបានរាយខាងលើតែប៉ុណ្ណោះ។ ចំពោះរាល់ការចំណាយផ្ទាល់ខ្លួនផ្សេងៗទៀត រួមមានមធ្យោបាយធ្វើដំណើរ ការទិញចំណីអាហារ/ភេសជ្ជៈបន្ថែម និងសកម្មភាពផ្ទាល់ខ្លួនផ្សេងៗ គឺជាបន្ទុកទទួលខុសត្រូវដោយខ្លួនឯង។
            </p>
          </div>
        </div>
      </div>
      {/* ── FRAME 3: PERSON CARD ── */}
      <div className="denied-card">
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {/* 150×150 avatar */}
          <div style={{
            width: "150px", height: "150px", flexShrink: 0, borderRadius: "20px",
            background: "rgba(220,38,38,0.15)", border: "2px solid rgba(220,38,38,0.45)",
            overflow: "hidden",
          }}>
            {deniedPerson.photo ? (
              <img src={deniedPerson.photo} alt={deniedPerson.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="1.5" style={{ width: "40px", height: "40px" }}>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: "8px" }}>
              {deniedPerson.name}
            </div>
            <div style={{ fontFamily: "'Karla',sans-serif", fontSize: "14px", color: "rgba(255,200,200,0.8)", lineHeight: 1.6 }}>
              {deniedPerson.reason}
            </div>
            <div style={{ fontFamily: "'Karla',sans-serif", fontSize: "13px", color: "rgba(255,160,160,0.55)", fontStyle: "italic", marginTop: "4px" }}>
              {deniedPerson.englishReason}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(220,38,38,0.2)" }}>
          <span style={{ fontFamily: "'Karla',sans-serif", fontSize: "11.5px", color: "rgba(255,140,140,0.4)", fontStyle: "italic" }}>
            System notice by trip organizer
          </span>
        </div>
      </div>

      {/* ── FRAME 4: PAYMENT RECEIVED ── */}
      <div className="received-section">
        <div className="received-header">
          <div className="received-header-left">
            <span>Payment Received</span>
          </div>
          <span className="received-count">
            {paidCount} / {payments.length} paid
          </span>
        </div>

        <div className="received-list">
          {payments.map((person) => (
            <div
              key={person.id}
              className="received-row"
              onClick={() => onViewReceipt(person.receipt, person.name)}
              style={{ cursor: "pointer" }}
              title="Click to view receipt"
            >
              <div className="received-info">
                <div className="received-name">{person.name}</div>
              </div>
              <div className="received-amount">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="amount-val">${person.amount.toFixed(2)}</span>
                  <button
                    className="view-receipt-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReceipt(person.receipt, person.name);
                    }}
                    title="View Receipt"
                    style={{ marginTop: 0 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
                <span className="paid-badge">✓ Paid</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer total */}
        <div className="received-footer">
          <span className="received-footer-label"> Total Collected</span>
          <span className="received-footer-total">${totalCollected.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
