"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label="Pilih mode tampilan"
    >
      <button
        type="button"
        className={`theme-toggle-btn ${theme === "light" ? "is-active" : ""}`}
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        title="Mode putih"
      >
        <SunIcon />
        <span>Putih</span>
      </button>
      <button
        type="button"
        className={`theme-toggle-btn ${theme === "dark" ? "is-active" : ""}`}
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        title="Mode gelap"
      >
        <MoonIcon />
        <span>Gelap</span>
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" />
    </svg>
  );
}
