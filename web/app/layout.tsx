import type { Metadata } from "next";
import { Manrope, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkRootProvider } from "./clerk-root-provider";
import { ClerkUserSync } from "./clerk-user-sync";
import { ClerkProviderGuard } from "./clerk-provider-guard";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta"
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
      <body className={`${manrope.variable} ${fraunces.variable} ${jakarta.variable}`}>
        <ClerkProviderGuard>
          <ClerkRootProvider>
            <ClerkUserSync />
            {children}
          </ClerkRootProvider>
        </ClerkProviderGuard>
      </body>
    </html>
  );
}