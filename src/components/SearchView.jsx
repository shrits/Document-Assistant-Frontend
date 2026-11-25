import React, { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { api } from "../api.js";

export default function SearchView({ onOpenCitation }) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.semanticSearch({
        query: query.trim(),
        visibility,
        top_k: 12,
      });
      setHits(res.hits || []);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <strong>Semantic Search</strong>
        <span className="muted">Search passages directly across all accessible documents</span>
      </div>

      <div className="content-scroll">
        <form className="card" onSubmit={handleSearch} style={{ marginBottom: 16 }}>
          <div className="row">
            <input
              style={{ flex: 1, minWidth: 240 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts, clauses, tables, or figures..."
            />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="all">All Accessible</option>
              <option value="shared">Shared Only</option>
              <option value="private">Private Only</option>
            </select>
            <button className="btn primary" type="submit" disabled={loading}>
              <Search size={14} /> {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {error && <div className="error-box">{error}</div>}

        {searched && hits.length === 0 && (
          <div className="card muted">No matching passages found.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {hits.map((h) => (
            <div key={h.chunk_id} className="card">
              <div className="row space-between" style={{ marginBottom: 6 }}>
                <div className="row">
                  <strong>{h.document_title}</strong>
                  <span className="badge">{h.section_label}</span>
                  <span className="badge">Para {h.paragraph_index}</span>
                  <span className="badge accent">{Math.round(h.score * 100)}% match</span>
                </div>
                <button
                  className="btn sm"
                  onClick={() => onOpenCitation(h.document_id, h.chunk_id)}
                >
                  <BookOpen size={12} /> Jump to Passage
                </button>
              </div>
              <div className="chunk-text">{h.excerpt}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
