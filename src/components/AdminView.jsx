import React, { useEffect, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { api } from "../api.js";

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");

  async function loadAll() {
    try {
      const [u, inv] = await Promise.all([api.listUsers(), api.listInvites()]);
      setUsers(u);
      setInvites(inv);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateInvite(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createInvite({
        email: email.trim() || null,
        role,
        expires_in_days: days,
      });
      setEmail("");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateQuota(userId) {
    const val = window.prompt("New storage quota in MB:", "1000");
    if (!val) return;
    const mb = Number(val);
    if (!Number.isFinite(mb) || mb < 10) return;
    try {
      await api.updateUserQuota(userId, mb);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function copyToken(inv) {
    navigator.clipboard.writeText(inv.token);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(""), 1500);
  }

  return (
    <>
      <div className="topbar">
        <strong>Admin & Invites</strong>
        <span className="muted">Invite-only access & per-user storage quotas</span>
      </div>

      <div className="content-scroll" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div className="error-box">{error}</div>}

        <form className="card" onSubmit={handleCreateInvite}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Generate Invite Token</div>
          <div className="row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional: restrict to email"
              style={{ minWidth: 220 }}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ width: 90 }}
              title="Valid for N days"
            />
            <button className="btn primary" type="submit">
              <UserPlus size={14} /> Create Invite
            </button>
          </div>
        </form>

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Invites</div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Email Lock</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <code>{inv.token.slice(0, 18)}...</code>
                  </td>
                  <td>{inv.email || "Any"}</td>
                  <td>{inv.role}</td>
                  <td>
                    {inv.used_at ? (
                      <span className="badge">Used</span>
                    ) : (
                      <span className="badge accent">Active</span>
                    )}
                  </td>
                  <td>
                    <button className="btn sm" onClick={() => copyToken(inv)}>
                      <Copy size={12} /> {copiedId === inv.id ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Users & Storage Quotas</div>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Used / Quota</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {(u.storage_used_bytes / (1024 * 1024)).toFixed(1)} /{" "}
                    {(u.storage_quota_bytes / (1024 * 1024)).toFixed(0)} MB
                  </td>
                  <td>
                    <button className="btn sm" onClick={() => handleUpdateQuota(u.id)}>
                      Edit Quota
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
