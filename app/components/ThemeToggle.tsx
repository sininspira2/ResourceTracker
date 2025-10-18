"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

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
      <Sun
        className={`absolute h-5 w-5 text-text-warning transition-all duration-300 ${
          currentTheme === "light"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 -rotate-90 opacity-0"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 text-text-link transition-all duration-300 ${
          currentTheme === "dark"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 rotate-90 opacity-0"
        }`}
      />
      <SunMoon
        className={`absolute h-5 w-5 text-text-secondary transition-all duration-300 ${
          currentTheme === "system"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 rotate-90 opacity-0"
        }`}
      />
      {/* Hover effect */}
      <div className="absolute inset-0 rounded-lg bg-background-toggle-hover opacity-0 transition-opacity duration-200 group-hover:opacity-10"></div>
    </button>
  );
}
