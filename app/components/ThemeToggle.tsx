'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  try {
    const { theme, toggleTheme } = useTheme()

    return (
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 group"
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {/* Sun Icon */}
        <svg
          className={`absolute h-5 w-5 text-yellow-500 transition-all duration-300 ${
            theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
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
          className={`absolute h-5 w-5 text-blue-500 transition-all duration-300 ${
            theme === 'light' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
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
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
      </button>
    )
  } catch (error) {
    // Fallback if useTheme is not available (shouldn't happen with proper setup)
    console.warn('ThemeToggle: useTheme hook not available, rendering fallback')
    return (
      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
    )
  }
} 