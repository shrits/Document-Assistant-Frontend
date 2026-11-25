import React, { useState } from "react";
import { api, setToken } from "../api.js";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await api.login(email, password)
          : await api.registerInvite({
              token: inviteToken,
              email,
              name,
              password,
            });
      setToken(res.access_token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div>
          <h2 style={{ margin: "0 0 4px 0" }}>Document Assistant</h2>
          <div className="muted">Self-hosted source-grounded workspace</div>
        </div>

        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`nav-btn ${mode === "invite" ? "active" : ""}`}
            onClick={() => setMode("invite")}
          >
            Use Invite
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {mode === "invite" && (
          <>
            <div className="field">
              <label>Invite Token</label>
              <input
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                required
                placeholder="Paste invite token"
              />
            </div>
            <div className="field">
              <label>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
          </>
        )}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@local.dev"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "invite" ? 8 : 1}
            placeholder="••••••••"
          />
        </div>

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
