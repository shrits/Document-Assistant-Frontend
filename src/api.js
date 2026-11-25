const API_BASE = "";

export function getToken() {
  return localStorage.getItem("doc_assistant_token") || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("doc_assistant_token", token);
  } else {
    localStorage.removeItem("doc_assistant_token");
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData) && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {
      // ignore non-JSON error
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  if (options.responseType === "blob") {
    return res.blob();
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  registerInvite: (payload) =>
    request("/api/auth/register-invite", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/auth/me"),

  // Documents
  listDocuments: (visibility = "all") =>
    request(`/api/documents?visibility=${encodeURIComponent(visibility)}`),
  uploadDocument: (formData) =>
    request("/api/documents/upload", { method: "POST", body: formData }),
  updateDocument: (id, payload) =>
    request(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteDocument: (id) =>
    request(`/api/documents/${id}`, { method: "DELETE" }),
  getDocumentViewer: (id) =>
    request(`/api/documents/${id}/viewer`),
  downloadDocumentBlob: (id) =>
    request(`/api/documents/${id}/file`, { responseType: "blob" }),
  summarizeDocument: (id, mode = "document") =>
    request(`/api/documents/${id}/summarize`, { method: "POST", body: JSON.stringify({ mode }) }),

  // Search
  semanticSearch: (payload) =>
    request("/api/search", { method: "POST", body: JSON.stringify(payload) }),

  // Chat
  listSessions: () => request("/api/chat/sessions"),
  createSession: (title = "New Conversation") =>
    request("/api/chat/sessions", { method: "POST", body: JSON.stringify({ title }) }),
  deleteSession: (id) =>
    request(`/api/chat/sessions/${id}`, { method: "DELETE" }),
  getMessages: (sessionId) =>
    request(`/api/chat/sessions/${sessionId}/messages`),
  askQuestion: (sessionId, payload) =>
    request(`/api/chat/sessions/${sessionId}/ask`, { method: "POST", body: JSON.stringify(payload) }),

  // Exports
  exportSession: (sessionId, format, styled_template = true) =>
    request(`/api/exports/session/${sessionId}`, {
      method: "POST",
      body: JSON.stringify({ format, styled_template }),
      responseType: "blob",
    }),
  exportMessage: (messageId, format, styled_template = true) =>
    request(`/api/exports/message/${messageId}`, {
      method: "POST",
      body: JSON.stringify({ format, styled_template }),
      responseType: "blob",
    }),

  // Admin
  listUsers: () => request("/api/admin/users"),
  updateUserQuota: (userId, storage_quota_mb) =>
    request(`/api/admin/users/${userId}/quota`, {
      method: "PATCH",
      body: JSON.stringify({ storage_quota_mb }),
    }),
  listInvites: () => request("/api/admin/invites"),
  createInvite: (payload) =>
    request("/api/admin/invites", { method: "POST", body: JSON.stringify(payload) }),
};

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
