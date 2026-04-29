import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Browser Agent",
  description: "Local dashboard and API for the AI Browser Agent Chrome extension",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
