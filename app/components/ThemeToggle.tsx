"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getNextTheme = () => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  const toggleTheme = () => {
    setTheme(getNextTheme());
  };

  const currentTheme = isClient ? theme : "system";

  return (
    <button
      onClick={toggleTheme}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary transition-all duration-200 hover:bg-background-secondary"
      aria-label="Toggle theme"
      title={`Switch to ${getNextTheme()} mode`}
    >
      {/* Sun Icon */}
      <svg
        className={`absolute h-5 w-5 text-text-warning transition-all duration-300 ${
          currentTheme === "dark"
            ? "scale-0 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon */}
      <svg
        className={`absolute h-5 w-5 text-text-link transition-all duration-300 ${
          currentTheme === "light"
            ? "scale-0 -rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-lg bg-background-toggle-hover opacity-0 transition-opacity duration-200 group-hover:opacity-10"></div>
    </button>
  );
}
