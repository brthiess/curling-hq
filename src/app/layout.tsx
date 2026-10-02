import type { Metadata } from "next";
import Link from "next/link";
import { demoMode } from "@/lib/api";
import { Header } from "@/components/header";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Curling HQ · The game, at a glance",
    template: "%s · Curling HQ",
  },
  description:
    "Find curling events, game scores, and available playing lineups in one clear view.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header />
        {demoMode() && (
          <div className="demo-banner">
            Design preview · synthetic example data, not current curling results
          </div>
        )}
        <main id="main">{children}</main>
        <footer>
          <div className="footer-inner">
            <Link className="footer-brand" href="/">
              CURLING HQ
            </Link>
            <p>The game, at a glance.</p>
            <span>Scores reflect their last successful source check.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
