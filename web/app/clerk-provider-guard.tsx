"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { isClerkClientConfigured } from "@/lib/clerk-env";

const ClerkProvider = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.ClerkProvider),
  { ssr: false }
);

export function ClerkProviderGuard({ children }: { children: ReactNode }) {
  if (!isClerkClientConfigured()) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
