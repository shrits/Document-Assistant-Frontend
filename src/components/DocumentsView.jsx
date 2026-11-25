import React, { useState } from "react";
import { Clock, Eye, Lock, Sparkles, Trash2, Upload, Users } from "lucide-react";
import { api } from "../api.js";

export default function DocumentsView({ documents, onRefresh, onOpenViewer }) {
  const [file, setFile] = useState(null);
  const [storageMode, setStorageMode] = useState("permanent");
  const [expiryDays, setExpiryDays] = useState(7);
  const [visibility, setVisibility] = useState("private");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filterVis, setFilterVis] = useState("all");
  const [summarizingId, setSummarizingId] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("storage_mode", storageMode);
      fd.append("visibility", visibility);
      fd.append("tags", tags);
      if (storageMode === "temporary") {
        fd.append("expiry_days", String(expiryDays));
      }
      await api.uploadDocument(fd);
      setFile(null);
      setTags("");
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId) {
    if (!window.confirm("Delete this document and its indexed chunks?")) return;
    try {
      await api.deleteDocument(docId);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSummarize(docId, mode) {
    setError("");
    setSummarizingId(`${docId}:${mode}`);
    try {
      await api.summarizeDocument(docId, mode);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSummarizingId("");
    }
  }

  const visibleDocs = documents.filter((d) =>
    filterVis === "all" ? true : d.visibility === filterVis
  );

  return (
    <>
      <div className="topbar">
        <strong>Document Library</strong>
        <div className="row">
          {["all", "shared", "private"].map((v) => (
            <button
              key={v}
              className={`btn sm ${filterVis === v ? "primary" : ""}`}
              onClick={() => setFilterVis(v)}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="content-scroll">
        {error && (
          <div className="error-box" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form className="card" onSubmit={handleUpload} style={{ marginBottom: 18 }}>
          <div className="row space-between" style={{ marginBottom: 10 }}>
            <strong>Upload Document</strong>
            <span className="muted">
              PDF, DOCX, PPTX, XLSX, EPUB, TXT, MD, CSV, PNG/JPG (OCR enabled)
            </span>
          </div>
          <div className="row">
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.epub,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <select value={storageMode} onChange={(e) => setStorageMode(e.target.value)}>
              <option value="permanent">Permanent (Encrypted)</option>
              <option value="temporary">Temporary (Auto-Expire)</option>
            </select>
            {storageMode === "temporary" && (
              <input
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                style={{ width: 90 }}
                title="Expire after N days"
              />
            )}
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="private">Private</option>
              <option value="shared">Shared Library</option>
            </select>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              style={{ minWidth: 180 }}
            />
            <button className="btn primary" type="submit" disabled={uploading || !file}>
              <Upload size={14} /> {uploading ? "Parsing & Indexing..." : "Upload"}
            </button>
          </div>
        </form>

        <div className="doc-grid">
          {visibleDocs.map((doc) => (
            <div key={doc.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="row space-between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{doc.title}</div>
                  <div className="muted">
                    {doc.filename} • {(doc.size_bytes / 1024).toFixed(1)} KB • {doc.chunk_count} chunks
                  </div>
                </div>
                <span className="badge">{doc.file_ext.replace(".", "").toUpperCase()}</span>
              </div>

              <div className="row">
                <span className={`badge ${doc.visibility === "shared" ? "accent" : ""}`}>
                  {doc.visibility === "shared" ? <Users size={11} /> : <Lock size={11} />}{" "}
                  {doc.visibility}
                </span>
                <span className="badge">
                  {doc.storage_mode === "temporary" ? (
                    <>
                      <Clock size={11} /> expires{" "}
                      {doc.expires_at ? new Date(doc.expires_at).toLocaleDateString() : "soon"}
                    </>
                  ) : (
                    "encrypted"
                  )}
                </span>
                {doc.ocr_used && <span className="badge warn">OCR</span>}
                {doc.tags.map((t) => (
                  <span key={t} className="badge">
                    #{t}
                  </span>
                ))}
              </div>

              {doc.summary && (
                <div
                  style={{
                    fontSize: 12,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: 8,
                    whiteSpace: "pre-wrap",
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                >
                  {doc.summary}
                </div>
              )}

              <div className="row" style={{ marginTop: "auto" }}>
                <button className="btn sm" onClick={() => onOpenViewer(doc.id, null)}>
                  <Eye size={12} /> View
                </button>
                <button
                  className="btn sm"
                  disabled={Boolean(summarizingId)}
                  onClick={() => handleSummarize(doc.id, "document")}
                >
                  <Sparkles size={12} />{" "}
                  {summarizingId === `${doc.id}:document` ? "Summarizing..." : "Summarize"}
                </button>
                <button
                  className="btn sm"
                  disabled={Boolean(summarizingId)}
                  onClick={() => handleSummarize(doc.id, "chapters")}
                >
                  {summarizingId === `${doc.id}:chapters` ? "Working..." : "Chapters"}
                </button>
                <button
                  className="btn sm danger"
                  style={{ marginLeft: "auto" }}
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
