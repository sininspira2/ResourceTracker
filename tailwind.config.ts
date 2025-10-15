import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "background-primary": "var(--color-background-primary)",
        "background-secondary": "var(--color-background-secondary)",
        "background-tertiary": "var(--color-background-tertiary)",
        "background-modal": "var(--color-background-modal)",
        "background-danger": "var(--color-background-danger)",
        "background-info": "var(--color-background-info)",
        "background-info-hover": "var(--color-background-info-hover)",
        "background-success": "var(--color-background-success)",

        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        "text-quaternary": "var(--color-text-quaternary)",
        "text-link": "var(--color-text-link)",
        "text-link-hover": "var(--color-text-link-hover)",
        "text-danger": "var(--color-text-danger)",
        "text-success": "var(--color-text-success)",
        "text-white": "var(--color-text-white)",

        "border-primary": "var(--color-border-primary)",
        "border-secondary": "var(--color-border-secondary)",
        "border-danger": "var(--color-border-danger)",
        "border-info": "var(--color-border-info)",
        "border-success": "var(--color-border-success)",

        "button-primary-bg": "var(--color-button-primary-bg)",
        "button-primary-bg-hover": "var(--color-button-primary-bg-hover)",
        "button-secondary-bg": "var(--color-button-secondary-bg)",
        "button-secondary-bg-hover": "var(--color-button-secondary-bg-hover)",
        "button-secondary-text": "var(--color-button-secondary-text)",
        "button-danger-bg": "var(--color-button-danger-bg)",
        "button-danger-bg-hover": "var(--color-button-danger-bg-hover)",
        "button-success-bg": "var(--color-button-success-bg)",
        "button-success-bg-hover": "var(--color-button-success-bg-hover)",
        "button-neutral-bg": "var(--color-button-neutral-bg)",
        "button-neutral-bg-hover": "var(--color-button-neutral-bg-hover)",

        "text-priority": "var(--color-text-priority)",

        "status-critical-bg": "var(--color-status-critical-bg)",
        "status-critical-text": "var(--color-status-critical-text)",
        "status-critical-border": "var(--color-status-critical-border)",
        "status-critical-bg-subtle": "var(--color-status-critical-bg-subtle)",
        "status-below-target-bg": "var(--color-status-below-target-bg)",
        "status-below-target-text": "var(--color-status-below-target-text)",
        "status-below-target-border": "var(--color-status-below-target-border)",
        "status-below-target-bg-subtle":
          "var(--color-status-below-target-bg-subtle)",
        "status-at-target-bg": "var(--color-status-at-target-bg)",
        "status-at-target-text": "var(--color-status-at-target-text)",
        "status-at-target-border": "var(--color-status-at-target-border)",
        "status-at-target-bg-subtle":
          "var(--color-status-at-target-bg-subtle)",
        "status-above-target-bg": "var(--color-status-above-target-bg)",
        "status-above-target-text": "var(--color-status-above-target-text)",
        "status-above-target-border": "var(--color-status-above-target-border)",
        "status-above-target-bg-subtle":
          "var(--color-status-above-target-bg-subtle)",
        "status-default-bg": "var(--color-status-default-bg)",
        "status-default-text": "var(--color-status-default-text)",
        "status-default-border": "var(--color-status-default-border)",
        "status-default-bg-subtle": "var(--color-status-default-bg-subtle)",

        "update-indicator-bg": "var(--color-update-indicator-bg)",
        "update-indicator-bg-hover": "var(--color-update-indicator-bg-hover)",
        "update-indicator-border": "var(--color-update-indicator-border)",
        "update-indicator-ring": "var(--color-update-indicator-ring)",
        "update-indicator-text": "var(--color-update-indicator-text)",

        "multiplier-high-bg": "var(--color-multiplier-high-bg)",
        "multiplier-high-text": "var(--color-multiplier-high-text)",
        "multiplier-medium-bg": "var(--color-multiplier-medium-bg)",
        "multiplier-medium-text": "var(--color-multiplier-medium-text)",
        "multiplier-low-bg": "var(--color-multiplier-low-bg)",
        "multiplier-low-text": "var(--color-multiplier-low-text)",
        "multiplier-very-low-bg": "var(--color-multiplier-very-low-bg)",
        "multiplier-very-low-text": "var(--color-multiplier-very-low-text)",
        "multiplier-zero-bg": "var(--color-multiplier-zero-bg)",
        "multiplier-zero-text": "var(--color-multiplier-zero-text)",

        "rank-1-bg": "var(--color-rank-1-bg)",
        "rank-1-text": "var(--color-rank-1-text)",
        "rank-2-bg": "var(--color-rank-2-bg)",
        "rank-2-text": "var(--color-rank-2-text)",
        "rank-3-bg": "var(--color-rank-3-bg)",
        "rank-3-text": "var(--color-rank-3-text)",
        "rank-other-bg": "var(--color-rank-other-bg)",
        "rank-other-text": "var(--color-rank-other-text)",

        "activity-positive-bg": "var(--color-activity-positive-bg)",
        "activity-negative-bg": "var(--color-activity-negative-bg)",
        "activity-neutral-bg": "var(--color-activity-neutral-bg)",

        "button-tertiary-bg": "var(--color-button-tertiary-bg)",
        "button-tertiary-bg-hover": "var(--color-button-tertiary-bg-hover)",

        "category-raw-bg": "var(--color-category-raw-bg)",
        "category-raw-text": "var(--color-category-raw-text)",
        "category-refined-bg": "var(--color-category-refined-bg)",
        "category-refined-text": "var(--color-category-refined-text)",
        "category-components-bg": "var(--color-category-components-bg)",
        "category-components-text": "var(--color-category-components-text)",
        "category-other-bg": "var(--color-category-other-bg)",
        "category-other-text": "var(--color-category-other-text)",
        "category-bp-bg": "var(--color-category-bp-bg)",
        "category-bp-bg-hover": "var(--color-category-bp-bg-hover)",

        "progress-bar-at-target-bg":
          "var(--color-progress-bar-at-target-bg)",
        "progress-bar-below-target-bg":
          "var(--color-progress-bar-below-target-bg)",
        "progress-bar-critical-bg": "var(--color-progress-bar-critical-bg)",

        "text-accent": "var(--color-text-accent)",
        "text-accent-dark": "var(--color-text-accent-dark)",

        "background-accent-primary": "var(--color-background-accent-primary)",
        "background-accent-secondary":
          "var(--color-background-accent-secondary)",
        "background-accent-tertiary": "var(--color-background-accent-tertiary)",

        "border-accent-primary": "var(--color-border-accent-primary)",
        "border-accent-secondary": "var(--color-border-accent-secondary)",

        "text-warning": "var(--color-text-warning)",

        "button-login-bg": "var(--color-button-login-bg)",
        "button-login-bg-hover": "var(--color-button-login-bg-hover)",

        "background-warning": "var(--color-background-warning)",

        "background-toggle-hover": "var(--color-background-toggle-hover)",

        "text-bugfix": "var(--color-text-bugfix)",
        "text-breaking": "var(--color-text-breaking)",

        "gradient-success-from": "var(--color-gradient-success-from)",
        "gradient-success-to": "var(--color-gradient-success-to)",

        "button-subtle-blue-bg": "var(--color-button-subtle-blue-bg)",
        "button-subtle-blue-bg-hover":
          "var(--color-button-subtle-blue-bg-hover)",
        "button-subtle-blue-text": "var(--color-button-subtle-blue-text)",
        "button-subtle-purple-bg": "var(--color-button-subtle-purple-bg)",
        "button-subtle-purple-bg-hover":
          "var(--color-button-subtle-purple-bg-hover)",
        "button-subtle-purple-text": "var(--color-button-subtle-purple-text)",
        "button-subtle-green-bg": "var(--color-button-subtle-green-bg)",
        "button-subtle-green-bg-hover":
          "var(--color-button-subtle-green-bg-hover)",
        "button-subtle-green-text": "var(--color-button-subtle-green-text)",
        "button-subtle-orange-bg": "var(--color-button-subtle-orange-bg)",
        "button-subtle-orange-bg-hover":
          "var(--color-button-subtle-orange-bg-hover)",
        "button-subtle-orange-text": "var(--color-button-subtle-orange-text)",
        "button-subtle-yellow-bg": "var(--color-button-subtle-yellow-bg)",
        "button-subtle-yellow-bg-hover":
          "var(--color-button-subtle-yellow-bg-hover)",
        "button-subtle-yellow-text": "var(--color-button-subtle-yellow-text)",
        "button-subtle-red-bg": "var(--color-button-subtle-red-bg)",
        "button-subtle-red-bg-hover":
          "var(--color-button-subtle-red-bg-hover)",
        "button-subtle-red-text": "var(--color-button-subtle-red-text)",
        "button-subtle-gray-bg": "var(--color-button-subtle-gray-bg)",
        "button-subtle-gray-text": "var(--color-button-subtle-gray-text)",

        "highlight-bg": "var(--color-highlight-bg)",
        "highlight-border": "var(--color-highlight-border)",

        "tag-selected-bg": "var(--color-tag-selected-bg)",
        "tag-selected-text": "var(--color-tag-selected-text)",

        "tag-neutral-bg": "var(--color-tag-neutral-bg)",
        "tag-neutral-text": "var(--color-tag-neutral-text)",

        "leaderboard-gradient-from": "var(--color-leaderboard-gradient-from)",
        "leaderboard-gradient-to": "var(--color-leaderboard-gradient-to)",
        "leaderboard-gradient-from-hover":
          "var(--color-leaderboard-gradient-from-hover)",
        "leaderboard-gradient-to-hover":
          "var(--color-leaderboard-gradient-to-hover)",

        "button-icon-danger-text": "var(--color-button-icon-danger-text)",
        "button-icon-danger-text-hover":
          "var(--color-button-icon-danger-text-hover)",
        "button-icon-danger-bg-hover":
          "var(--color-button-icon-danger-bg-hover)",

        "background-tooltip": "var(--color-background-tooltip)",
        "text-tooltip": "var(--color-text-tooltip)",
        "text-tooltip-secondary": "var(--color-text-tooltip-secondary)",
        "text-tooltip-accent": "var(--color-text-tooltip-accent)",

        "modal-header-text": "var(--color-modal-header-text)",
        "modal-header-icon-hover-bg": "var(--color-modal-header-icon-hover-bg)",

        "version-tag-bg": "var(--color-version-tag-bg)",
        "version-tag-text": "var(--color-version-tag-text)",

        "button-secondary-neutral-bg": "var(--color-button-secondary-neutral-bg)",
        "button-secondary-neutral-bg-hover":
          "var(--color-button-secondary-neutral-bg-hover)",

        "text-danger-hover": "var(--color-text-danger-hover)",

        "background-purple-subtle": "var(--color-background-purple-subtle)",
        "text-purple": "var(--color-text-purple)",
        "text-purple-subtle": "var(--color-text-purple-subtle)",

        "button-prominent-bg": "var(--color-button-prominent-bg)",
        "button-prominent-blue-text":
          "var(--color-button-prominent-blue-text)",
        "button-prominent-blue-bg-hover":
          "var(--color-button-prominent-blue-bg-hover)",
        "button-prominent-red-text": "var(--color-button-prominent-red-text)",
        "button-prominent-red-bg-hover":
          "var(--color-button-prominent-red-bg-hover)",

        "icon-prominent-blue": "var(--color-icon-prominent-blue)",
        "icon-prominent-red": "var(--color-icon-prominent-red)",

        "tag-discord-role-bg": "var(--color-tag-discord-role-bg)",
        "tag-discord-role-text": "var(--color-tag-discord-role-text)",

        "background-loading": "var(--color-background-loading)",
      },
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