import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_TOPIC, SITE_KICKER, SITE_DESCRIPTION } from "../lib/config";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_KICKER}`,
  description: SITE_DESCRIPTION,
  keywords: [SITE_TOPIC, "LLM", "machine learning", "trending", "signal", "communities"],
  icons: { icon: "/favicon.svg" },
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
