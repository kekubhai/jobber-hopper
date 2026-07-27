"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Sign in to sync profile and link the extension.");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    setBusy(true);
    setStatus("Signing in...");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }

      setStatus("Signed in. Your profile saves to your account.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    setBusy(true);
    setStatus("Creating account...");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }

      setStatus("Check your email to confirm the account, then sign in.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setPairingCode(null);
    setStatus("Signed out.");
  }

  async function createExtensionPairingCode() {
    setBusy(true);
    setPairingCode(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        throw new Error("Sign in first");
      }

      const response = await fetch("/api/extension/pairing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ refreshToken: session.refresh_token })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Could not create pairing code");
      }

      const payload = await response.json() as { code: string; expiresInSeconds: number };
      setPairingCode(payload.code);
      setStatus(`Enter code ${payload.code} in the extension popup (expires in ${Math.round(payload.expiresInSeconds / 60)} min).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pairing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Sign in and link extension</h2>
        </div>
        <p>Supabase auth ties the dashboard and extension to one profile. Local dev still works with <code>local-dev-user</code> when signed out.</p>
      </div>

      {session ? (
        <div className="stack">
          <p className="status-line">Signed in as {session.user.email ?? session.user.id}</p>
          <div className="button-row">
            <button className="button-secondary" type="button" disabled={busy} onClick={() => void createExtensionPairingCode()}>
              Generate extension code
            </button>
            <button className="button-secondary" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
          {pairingCode ? (
            <p className="help-copy">
              Extension pairing code: <strong>{pairingCode}</strong>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="stack">
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="button-row">
            <button type="button" disabled={busy} onClick={() => void signIn()}>
              Sign in
            </button>
            <button className="button-secondary" type="button" disabled={busy} onClick={() => void signUp()}>
              Sign up
            </button>
          </div>
        </div>
      )}

      <p className="status-line">{status}</p>
    </section>
  );
}

export function useProfileAuthHeaders() {
  const [headers, setHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function refresh() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      setHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    }

    void refresh();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return headers;
}
