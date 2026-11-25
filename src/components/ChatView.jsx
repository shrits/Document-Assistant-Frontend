import React, { useState } from "react";
import { BookOpen, Download, GitCompare, Send } from "lucide-react";
import { api, triggerBlobDownload } from "../api.js";

export default function ChatView({
  session,
  messages,
  documents,
  onAsk,
  onOpenCitation,
  busy,
}) {
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState("all");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  function toggleDoc(id) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    setError("");
    try {
      await onAsk({
        question: question.trim(),
        scope,
        document_ids: scope === "selected" ? selectedDocIds : null,
        compare_mode: scope === "selected" && selectedDocIds.length >= 2 && compareMode,
      });
      setQuestion("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExportThread(fmt) {
    if (!session) return;
    setExporting(true);
    try {
      const blob = await api.exportSession(session.id, fmt, true);
      triggerBlobDownload(blob, `conversation.${fmt}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSingle(msgId, fmt) {
    setExporting(true);
    try {
      const blob = await api.exportMessage(msgId, fmt, true);
      triggerBlobDownload(blob, `answer.${fmt}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <strong>{session ? session.title : "New Conversation"}</strong>
          <div className="muted">Answers strictly from your uploaded sources with citations</div>
        </div>
        {session && messages.length > 0 && (
          <div className="row">
            <span className="muted">Export thread:</span>
            {["pdf", "docx", "md", "txt"].map((fmt) => (
              <button
                key={fmt}
                className="btn sm"
                disabled={exporting}
                onClick={() => handleExportThread(fmt)}
              >
                <Download size={12} /> {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="content-scroll">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <h3 style={{ marginTop: 0 }}>Ask your documents anything</h3>
              <p className="muted">
                Every response cites exact sections and paragraphs. If an answer is not in your
                uploaded files, the assistant explicitly tells you instead of guessing.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`msg-bubble ${m.role}`}>
              {m.role === "assistant" && (
                <div className="row space-between" style={{ marginBottom: 8 }}>
                  <div className="row">
                    {m.not_found ? (
                      <span className="badge warn">Not found in documents</span>
                    ) : (
                      <>
                        <span className="badge accent">
                          Based on {m.source_count} source{m.source_count === 1 ? "" : "s"}
                        </span>
                        {m.confidence && (
                          <span className="badge">Confidence: {m.confidence}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="row">
                    {["pdf", "docx", "md"].map((fmt) => (
                      <button
                        key={fmt}
                        className="btn sm"
                        disabled={exporting}
                        onClick={() => handleExportSingle(m.id, fmt)}
                        title={`Export answer as ${fmt.toUpperCase()}`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="msg-text">{m.content}</div>

              {m.citations && m.citations.length > 0 && (
                <div className="citation-list">
                  {m.citations.map((c) => (
                    <button
                      key={`${m.id}-${c.index}-${c.chunk_id}`}
                      className={`citation-chip ${c.source_expired ? "expired" : ""}`}
                      disabled={c.source_expired}
                      onClick={() => onOpenCitation(c.document_id, c.chunk_id)}
                      title={c.source_expired ? "Source document has expired" : c.excerpt}
                    >
                      <BookOpen size={12} />
                      <span>
                        [{c.index}] {c.document_title} — {c.section_label}, Para {c.paragraph_index}
                      </span>
                      {c.source_expired && <span className="badge danger">expired</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form className="chat-composer" onSubmit={handleSend}>
        <div className="composer-inner">
          {error && <div className="error-box">{error}</div>}
          <div className="row">
            <span className="muted">Scope:</span>
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">All Accessible Docs ({documents.length})</option>
              <option value="shared">Shared Library</option>
              <option value="private">My Private Docs</option>
              <option value="selected">Select Specific Docs</option>
            </select>

            {scope === "selected" && selectedDocIds.length >= 2 && (
              <label className="row" style={{ fontSize: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                />
                <GitCompare size={13} /> Compare Mode
              </label>
            )}
          </div>

          {scope === "selected" && (
            <div className="row" style={{ maxHeight: 80, overflowY: "auto" }}>
              {documents.map((doc) => {
                const active = selectedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    className={`btn sm ${active ? "primary" : ""}`}
                    onClick={() => toggleDoc(doc.id)}
                  >
                    {doc.title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="composer-row">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask a question about your documents..."
            />
            <button className="btn primary" type="submit" disabled={busy || !question.trim()}>
              <Send size={14} /> {busy ? "Thinking..." : "Ask"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
