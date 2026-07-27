"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function SiteAuthNav() {
  return (
    <nav className="site-auth-nav" aria-label="Account">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="nav-auth-btn">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className="nav-auth-btn nav-auth-btn-secondary">
            Sign up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </nav>
  );
}
