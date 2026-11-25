import React from "react";
import {
  FileText,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onLogout,
}) {
  const usedPct = Math.min(
    100,
    Math.round(((user.storage_used_bytes || 0) / Math.max(user.storage_quota_bytes || 1, 1)) * 100)
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>Document Assistant</span>
        <span className="badge accent">{user.role}</span>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare size={14} /> Chat
        </button>
        <button
          className={`nav-btn ${activeTab === "docs" ? "active" : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          <FileText size={14} /> Docs
        </button>
        <button
          className={`nav-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          <Search size={14} /> Search
        </button>
        {user.role === "owner" && (
          <button
            className={`nav-btn ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <Shield size={14} /> Admin
          </button>
        )}
      </div>

      <button className="btn primary" onClick={onNewSession}>
        <Plus size={14} /> New Chat
      </button>

      <div className="session-list">
        <div className="muted" style={{ padding: "4px 6px" }}>
          Conversations
        </div>
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`session-item ${activeTab === "chat" && s.id === activeSessionId ? "active" : ""}`}
            onClick={() => {
              setActiveTab("chat");
              onSelectSession(s.id);
            }}
          >
            <span className="session-title">{s.title}</span>
            <button
              className="btn sm"
              style={{ padding: "2px 5px", border: "none", background: "transparent" }}
              title="Delete chat"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(s.id);
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <div className="row space-between" style={{ marginBottom: 4 }}>
          <span className="muted">Storage</span>
          <span className="muted">
            {formatMB(user.storage_used_bytes || 0)} / {formatMB(user.storage_quota_bytes)} MB
          </span>
        </div>
        <div className="quota-bar" style={{ marginBottom: 10 }}>
          <div className="quota-fill" style={{ width: `${usedPct}%` }} />
        </div>
        <div className="row space-between">
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
            <div className="muted">{user.email}</div>
          </div>
          <button className="btn sm" onClick={onLogout} title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
