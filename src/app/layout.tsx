import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// One professional sans-serif for everything — headings are differentiated
// by weight/size, not by switching to a separate display face. The earlier
// rounded display font (Baloo 2) read as playful/consumer-app rather than
// something you'd want in front of company leadership.
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Sun Country Q3 Bonfire Challenge",
  description: "Answer questions, earn logs, build the biggest bonfire.",
  // Declared explicitly (not just relying on the src/app/icon.svg naming
  // convention) so the <link rel="icon"> tag is guaranteed to be present.
  // If it's still not showing after this, it's almost certainly the
  // browser's own favicon cache, which is notoriously sticky — try an
  // incognito window or a different browser to confirm.
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} style={{ "--font-display": "var(--font-body)" } as React.CSSProperties}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
