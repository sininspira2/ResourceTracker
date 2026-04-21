import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // The following are included to ensure Tailwind generates the correct classes for dynamic tier colors
    "./app/resources/[id]/page.tsx",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-success":
          "linear-gradient(to right, var(--color-gradient-success-from), var(--color-gradient-success-to))",
        "leaderboard-gradient":
          "linear-gradient(to right, var(--color-leaderboard-gradient-from), var(--color-leaderboard-gradient-to))",
        "leaderboard-gradient-hover":
          "linear-gradient(to right, var(--color-leaderboard-gradient-from-hover), var(--color-leaderboard-gradient-to-hover))",
        "modal-header-gradient":
          "linear-gradient(to right, var(--color-modal-header-gradient-from), var(--color-modal-header-gradient-to))",
      },
    },
  },
  plugins: [],
} satisfies Config;
