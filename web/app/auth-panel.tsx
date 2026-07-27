"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth
} from "@clerk/nextjs";
import { useState } from "react";

function AuthPanelMissingConfig() {
  return (
    <section className="section-card auth-panel" id="account">
      <div className="section-header">
        <div>
          <p className="eyebrow">Step 1 — Account</p>
          <h2>Sign in (Clerk)</h2>
        </div>
      </div>
      <p className="status-line auth-warning">
        Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to{" "}
        <code>web/.env.local</code>, then restart <code>pnpm dev:web</code>. Copy keys from{" "}
        <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
          dashboard.clerk.com
        </a>
        .
      </p>
    </section>
  );
}

function AuthPanelWithClerk() {
  const { isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState("Sign in with Google (or email), then generate a code for the extension.");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createExtensionPairingCode() {
    setBusy(true);
    setPairingCode(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Sign in first");
      }

      const response = await fetch("/api/extension/pairing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Could not create pairing code");
      }

      const payload = await response.json() as { code: string; expiresInSeconds: number };
      setPairingCode(payload.code);
      setStatus(`Paste code ${payload.code} in the extension popup (expires in ${Math.round(payload.expiresInSeconds / 60)} min).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pairing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-card auth-panel" id="account">
      <div className="section-header">
        <div>
          <p className="eyebrow">Step 1 — Account</p>
          <h2>Sign in</h2>
        </div>
        <p>
          Click <strong>Sign in</strong> and choose <strong>Continue with Google</strong> (or email). Then generate an
          extension link code.
        </p>
      </div>

      <ClerkLoading>
        <p className="status-line">Loading sign-in…</p>
      </ClerkLoading>

      <ClerkLoaded>
        <div className="auth-clerk-actions">
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="clerk-primary-btn">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="button-secondary clerk-secondary-btn">
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="signed-in-row">
              <UserButton afterSignOutUrl="/" />
              <button type="button" disabled={busy} onClick={() => void createExtensionPairingCode()}>
                Generate extension code
              </button>
            </div>
          </SignedIn>
        </div>

        {isSignedIn && pairingCode ? (
          <p className="help-copy pairing-code-display">
            Extension code: <strong>{pairingCode}</strong>
          </p>
        ) : null}
      </ClerkLoaded>

      <p className="status-line">{status}</p>
    </section>
  );
}

export function AuthPanel() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!clerkPublishableKey) {
    return <AuthPanelMissingConfig />;
  }

  return <AuthPanelWithClerk />;
}
