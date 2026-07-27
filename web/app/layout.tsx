import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import { ClerkRootProvider } from "./clerk-root-provider";
import { ClerkUserSync } from "./clerk-user-sync";
import { SiteAuthNav } from "./site-auth-nav";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Jobber Hopper",
  description: "Profile source of truth and browser automation workspace"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <ClerkProvider>
          <ClerkRootProvider>
            <ClerkUserSync />
            <SiteAuthNav />
            {children}
          </ClerkRootProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}