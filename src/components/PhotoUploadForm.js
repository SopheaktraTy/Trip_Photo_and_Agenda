"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Confetti from "@/components/Confetti";
import { payments } from "@/data/payments";

const isVideo = (file) => file.type.startsWith("video/");
const isImage = (file) => file.type.startsWith("image/");

export default function PhotoUploadForm({ onUploadSuccess, disabled = false }) {
  const [files, setFiles] = useState([]);           
  const [uploader, setUploader] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  // Custom dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addFiles = (incoming) => {
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    const arrayIncoming = Array.from(incoming);
    const oversized = arrayIncoming.some((f) => f.size > MAX_SIZE);

    if (oversized) {
      setErrorMessage("Maximum file size allowed is 500MB.");
      return;
    }

    const valid = arrayIncoming.filter(
      (f) => isImage(f) || isVideo(f)
    );
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...valid.filter((f) => !names.has(f.name + f.size))];
    });
    setErrorMessage("");
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) { setErrorMessage("Please select at least one photo or video."); return; }
    if (!uploader) { setErrorMessage("Please select who is uploading."); return; }

    setIsUploading(true);
    setErrorMessage("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIdx(i + 1);
        setUploadProgress(Math.round(((i) / files.length) * 100));

        // 1. Upload file to Google Drive via our backend API
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(`Google Drive upload failed for ${file.name}: ${errorData.error}`);
        }

        const uploadData = await uploadRes.json();
        const photoUrl = uploadData.url;

        // 2. Save metadata and Google Drive URL to Supabase
        const { error: dbError } = await supabase.from("trip_photos").insert([{
          photo_url: photoUrl,
          caption: caption,
          uploader: uploader,
          file_type: isVideo(file) ? "video" : "image",
        }]);

        if (dbError) throw new Error(`Supabase save failed for ${file.name}: ${dbError.message}`);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Reset
      setFiles([]);
      setCaption("");
      setUploader("");
      setShowConfetti(true);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentFileIdx(0);
    }
  };

  return (
    <>
    <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
    <div className="upload-section">
      <h3>Add a Memory</h3>
      <p style={{ color: "rgba(242,234,216,0.5)", fontSize: "13px", marginBottom: "20px" }}>
        Share photos &amp; videos from the Kompot road trip with the group.
      </p>

      {disabled && (
        <div className="upload-error-msg" style={{ marginBottom: "20px" }}>
          ⚙️ Supabase is not configured yet — open{" "}
          <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>.env.local</code>{" "}
          and add your credentials to enable uploads.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Custom Dropdown ── */}
        <div className="form-group">
          <label id="uploader-label">Who are you?</label>
          <div
            className={`custom-select-wrap ${dropdownOpen ? "open" : ""} ${disabled || isUploading ? "select-disabled" : ""}`}
            ref={dropdownRef}
          >
            <button
              type="button"
              className="custom-select-trigger"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              disabled={disabled || isUploading}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <span className={uploader ? "select-value" : "select-placeholder"}>
                {uploader || "— Select Participant —"}
              </span>
              <svg className="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownOpen && (
              <ul className="custom-select-list" role="listbox">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    role="option"
                    aria-selected={uploader === p.name}
                    className={`custom-select-option ${uploader === p.name ? "selected" : ""}`}
                    onClick={() => { setUploader(p.name); setDropdownOpen(false); setErrorMessage(""); }}
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Dropzone — multi file + video ── */}
        <div className="form-group">
          <label>Photos &amp; Videos</label>
          <div
            className={`file-dropzone ${files.length > 0 ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              type="file"
              id="file-input"
              accept="image/*,video/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => addFiles(e.target.files)}
              disabled={isUploading}
            />
            {files.length > 0 ? (
              <div className="dropzone-content file-selected">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="file-icon">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="file-details">
                  <span className="file-name">{files.length} file{files.length > 1 ? "s" : ""} selected</span>
                  <span className="file-size">Click to add more</span>
                </div>
              </div>
            ) : (
              <div className="dropzone-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="file-icon">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Drop photos &amp; videos here, or click to browse</span>
                <span className="dropzone-hint">Supports JPG, PNG, MP4, MOV &amp; more · Multiple files OK</span>
              </div>
            )}
          </div>
        </div>

        {/* ── File preview chips ── */}
        {files.length > 0 && (
          <div className="file-chips">
            {files.map((f, idx) => (
              <div key={idx} className={`file-chip ${isVideo(f) ? "chip-video" : "chip-image"}`}>
                {isVideo(f) ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chip-icon">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chip-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
                <span className="chip-name" title={f.name}>{f.name}</span>
                <span className="chip-size">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  aria-label={`Remove ${f.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Caption ── */}
        <div className="form-group">
          <label htmlFor="caption-input">Caption / Story</label>
          <textarea
            id="caption-input"
            rows="2"
            placeholder="Write a sweet caption or detail about this moment..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isUploading}
          />
        </div>

        {/* Error */}
        {errorMessage && <div className="upload-error-msg">{errorMessage}</div>}

        {/* Progress */}
        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="progress-text">
              Uploading {currentFileIdx} of {files.length}… {uploadProgress}%
            </span>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isUploading || disabled}>
          {isUploading ? `Uploading ${currentFileIdx}/${files.length}…` : `Post ${files.length > 1 ? `${files.length} Files` : "Memory"}`}
        </button>
      </form>
    </div>
    </>
  );
}
