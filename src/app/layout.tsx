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
      <head>
        {/* Cloudflare Web Analytics — paste your token from cloudflare.com/web-analytics */}
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
