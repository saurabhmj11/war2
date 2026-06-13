import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindMirror — The AI that listens beyond words",
  description: "AI-powered mental wellness companion for students. Uncovers hidden stress triggers and emotional patterns through psychologist-inspired conversation.",
  keywords: ["MindMirror", "mental wellness", "student stress", "AI companion", "JEE", "NEET", "UPSC"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
