import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The AI Hub — AI Reddit Dashboard",
  description:
    "A smarter Reddit for AI. Aggregates and ranks posts from 40+ AI subreddits using trending-first scoring.",
  keywords: ["AI", "LLM", "machine learning", "reddit", "dashboard", "LocalLLaMA", "ClaudeCode"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
