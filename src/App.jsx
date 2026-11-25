import React, { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";
import AdminView from "./components/AdminView.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import ChatView from "./components/ChatView.jsx";
import DocumentsView from "./components/DocumentsView.jsx";
import DocumentViewer from "./components/DocumentViewer.jsx";
import SearchView from "./components/SearchView.jsx";
import Sidebar from "./components/Sidebar.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [viewerState, setViewerState] = useState(null);

  async function refreshWorkspace() {
    const [me, docs, sess] = await Promise.all([
      api.me(),
      api.listDocuments("all"),
      api.listSessions(),
    ]);
    setUser(me);
    setDocuments(docs);
    setSessions(sess);
    if (!activeSessionId && sess.length > 0) {
      setActiveSessionId(sess[0].id);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      return;
    }
    refreshWorkspace()
      .catch(() => {
        setToken("");
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!activeSessionId || !user) {
      setMessages([]);
      return;
    }
    api.getMessages(activeSessionId).then(setMessages).catch(() => setMessages([]));
  }, [activeSessionId, user]);

  async function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
    await refreshWorkspace();
  }

  async function handleNewSession() {
    const created = await api.createSession("New Conversation");
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
    setMessages([]);
    setActiveTab("chat");
  }

  async function handleDeleteSession(id) {
    await api.deleteSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0]?.id || null);
    }
  }

  async function handleAsk(payload) {
    setAsking(true);
    try {
      let sid = activeSessionId;
      if (!sid) {
        const created = await api.createSession("New Conversation");
        setSessions((prev) => [created, ...prev]);
        sid = created.id;
        setActiveSessionId(sid);
      }
      const res = await api.askQuestion(sid, payload);
      setMessages((prev) => [...prev, res.user_message, res.assistant_message]);
      setSessions((prev) =>
        prev.map((s) => (s.id === res.session.id ? res.session : s))
      );
    } finally {
      setAsking(false);
    }
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    setSessions([]);
    setDocuments([]);
    setMessages([]);
    setActiveSessionId(null);
  }

  if (booting) {
    return (
      <div className="auth-wrapper">
        <div className="muted">Loading workspace...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
      />

      <main className="main-area">
        {activeTab === "chat" && (
          <ChatView
            session={activeSession}
            messages={messages}
            documents={documents}
            onAsk={handleAsk}
            onOpenCitation={(docId, chunkId) => setViewerState({ docId, chunkId })}
            busy={asking}
          />
        )}

        {activeTab === "docs" && (
          <DocumentsView
            documents={documents}
            onRefresh={refreshWorkspace}
            onOpenViewer={(docId, chunkId) => setViewerState({ docId, chunkId })}
          />
        )}

        {activeTab === "search" && (
          <SearchView
            onOpenCitation={(docId, chunkId) => setViewerState({ docId, chunkId })}
          />
        )}

        {activeTab === "admin" && user.role === "owner" && <AdminView />}
      </main>

      {viewerState && (
        <DocumentViewer
          documentId={viewerState.docId}
          highlightChunkId={viewerState.chunkId}
          onClose={() => setViewerState(null)}
        />
      )}
    </div>
  );
}
