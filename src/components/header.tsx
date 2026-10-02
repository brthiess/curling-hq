"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const searching = pathname === "/search";
  return (
    <header className="header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Curling HQ home">
          <svg className="brand-symbol" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="#152637" />
            <circle cx="20" cy="20" r="14" fill="white" />
            <circle cx="20" cy="20" r="9" fill="#c93936" />
            <circle cx="20" cy="20" r="3.5" fill="white" />
          </svg>
          <span className="brand-wordmark">
            Curling<span className="brand-hq">HQ</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/" aria-current={!searching ? "page" : undefined}>
            <span>
              Scores<span className="nav-wide"> & events</span>
            </span>
          </Link>
          <Link href="/search" aria-current={searching ? "page" : undefined}>
            <svg
              className="search-icon"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="8.5"
                cy="8.5"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m13 13 4 4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <span>Find a team</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
