"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** Attach Clerk session JWT to profile API calls when signed in (must run under ClerkProvider). */
export function useProfileAuthHeaders(): Record<string, string> {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [headers, setHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setHeaders({});
      return;
    }

    let cancelled = false;

    void getToken().then((token) => {
      if (!cancelled) {
        setHeaders(token ? { Authorization: `Bearer ${token}` } : {});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return headers;
}
