"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { isClerkClientConfigured } from "@/lib/clerk-env";

/** After Clerk login/signup, mirror user + profile shell into Supabase. */
export function ClerkUserSync() {
  const clerkReady = isClerkClientConfigured();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!clerkReady || !isLoaded || !isSignedIn || !user?.id) {
      if (!isSignedIn) {
        lastSyncedUserId.current = null;
      }
      return;
    }

    if (lastSyncedUserId.current === user.id) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const token = await getToken();
      if (!token || cancelled) {
        return;
      }

      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        lastSyncedUserId.current = user.id;
      } else {
        console.warn("[Jobber Hopper] Supabase user sync failed", response.status);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clerkReady, isLoaded, isSignedIn, user?.id, getToken]);

  return null;
}
