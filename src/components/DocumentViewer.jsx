import React, { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { api, triggerBlobDownload } from "../api.js";

export default function DocumentViewer({ documentId, highlightChunkId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const highlightRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    api
      .getDocumentViewer(documentId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  useEffect(() => {
    if (data && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data, highlightChunkId]);

  async function handleDownloadOriginal() {
    if (!data) return;
    const blob = await api.downloadDocumentBlob(data.document.id);
    triggerBlobDownload(blob, data.document.filename);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="topbar">
          <div>
            <strong>{data ? data.document.title : "Loading document..."}</strong>
            {data && (
              <div className="muted">
                {data.document.filename} • {data.document.page_count} page(s)/section(s)
                {data.document.author ? ` • ${data.document.author}` : ""}
              </div>
            )}
          </div>
          <div className="row">
            {data && (
              <button className="btn sm" onClick={handleDownloadOriginal}>
                <Download size={13} /> Original File
              </button>
            )}
            <button className="btn sm" onClick={onClose}>
              <X size={14} /> Close
            </button>
          </div>
        </div>

        <div className="content-scroll">
          {error && <div className="error-box">{error}</div>}
          {data && data.document.chapter_summaries && data.document.chapter_summaries.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <strong>Chapter / Section Summaries</strong>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {data.document.chapter_summaries.map((cs, idx) => (
                  <div key={idx}>
                    <div className="badge accent" style={{ marginBottom: 4 }}>
                      {cs.section}
                    </div>
                    <div className="chunk-text">{cs.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data &&
            data.chunks.map((ch) => {
              const isHighlighted = ch.id === highlightChunkId;
              return (
                <div
                  key={ch.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={`chunk-block ${isHighlighted ? "highlighted" : ""}`}
                >
                  <div className="row space-between">
                    <div className="row">
                      <span className="badge">{ch.section_label}</span>
                      <span className="badge">Para {ch.paragraph_index}</span>
                      {ch.chunk_type !== "prose" && (
                        <span className="badge warn">{ch.chunk_type}</span>
                      )}
                    </div>
                    {isHighlighted && <span className="badge accent">Cited Passage</span>}
                  </div>
                  <div className="chunk-text">{ch.text}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
