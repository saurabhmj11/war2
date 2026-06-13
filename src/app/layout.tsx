import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",   // Prevent invisible text during font load (FOIT)
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: "MindMirror — AI Wellness Companion That Listens Beyond Words",
  description:
    "AI-powered mental wellness companion for students. Detects hidden stress triggers and emotional patterns through psychologist-inspired adaptive conversation.",
  keywords: ["MindMirror", "mental wellness", "student stress", "AI companion", "JEE", "NEET", "UPSC", "contradiction detection"],
  openGraph: {
    title: "MindMirror — AI Wellness Companion",
    description: "Uncovers hidden stress triggers by listening beyond words.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to speed up external resource fetches */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
