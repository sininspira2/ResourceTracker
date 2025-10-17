# 🚨⚠️Users Moving from the old tracker, and those updating from 3.x to 4.x - please refer to the [Database Migration Guide](./DB_MIGRATION.md).⚠️🚨

# Resource Tracker

A comprehensive resource management and tracking portal with Discord authentication and role-based access control. Perfect for gaming communities, organizations, and teams that need to track shared resources, inventory, or assets.

Made for Dune: Awakening. Originally forked from `https://github.com/theyetty` and adapted to the specific needs of my guild.

Removed from fork network due to original author repository being deleted, and database/backend changes incompatible with other forks.
---
I can certainly create the `changelog.json` entry and the detailed Markdown release notes for version 4.1.1. This release focuses on a major UI overhaul and refactoring to improve maintainability.

## `changelog.json` Entry

```json
{
  "currentVersion": "4.1.1",
  "releases": [
    {
      "version": "4.1.1",
      "date": "2025-10-16",
      "title": "Comprehensive Theming System and UI Refactoring",
      "type": "patch",
      "changes": [
        {
          "type": "feature",
          "description": "Implemented a comprehensive, robust theming system using Tailwind CSS custom properties, allowing for easy management of light and dark modes across the application. All major UI components (modals, navigation, tables, dashboards) have been refactored to utilize these new theme variables, ensuring a consistent visual experience."
        },
        {
          "type": "improvement",
          "description": "Refactored CSS color variables to use more semantic and intuitive names (e.g., replacing `--color-background-modal-content` with `--color-tile-background`). Color definitions are now centralized in `app/globals.css` and mapped in `tailwind.config.ts`, simplifying future color adjustments and maintenance."
        },
        {
          "type": "improvement",
          "description": "The theme switching logic was enhanced with a pre-hydration script to prevent visual flickering during initial page loads, providing a smoother user experience."
        },
        {
          "type": "other",
          "description": "Added Prettier and the Tailwind CSS plugin to enforce a consistent code style across the project. The entire codebase has been formatted to adhere to this new setup, reordering Tailwind CSS classes for consistency."
        }
      ]
    },
    {
      "version": "4.1.0",
      "date": "2025-10-10",
      "title": "Vercel Data Cache, Improved Migrations, and API Stability",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "The database schema has been updated to include a new `global_settings` table and new `tier` (integer) and `subcategory` (text) columns in the `resources` table. These columns are to support future features but allow for more granular classification."
        },
        {
          "type": "feature",
          "description": "The database migration tracking system has been completely overhauled from a manual, tag-based approach to an **improved, hash-based system**. This new system ensures cross-platform consistency, is integrated into build commands, and simplifies the user workflow (using only `npm run db:migrate`)."
        },
        {
          "type": "feature",
          "description": "Implemented Vercel's fetch-based Data Cache for API routes using a public/internal pattern. This drastically improves API response times by refactoring `GET` API routes to leverage the new caching strategy with appropriate revalidation times."
        },
        {
          "type": "improvement",
          "description": "Application protection logic was simplified by replacing the old middleware with a lightweight 'include list'."
        },
        {
          "type": "improvement",
          "description": "Client-side cache-busting headers were removed to allow for correct server-side caching, and the old custom caching implementation was deleted."
        },
        {
          "type": "bugfix",
          "description": "Fixed authentication issues by ensuring 'cookie' and 'authorization' headers are correctly forwarded in internal API calls, resolving persistent 401 errors when using Vercel Authentication."
        },
        {
          "type": "bugfix",
          "description": "Resolved critical build errors related to the Next.js 15 upgrade by updating all dynamic API route handlers to correctly use the new asynchronous `params` object signature."
        },
        {
          "type": "bugfix",
          "description": "Ensured data integrity on resource deletion by updating the `DELETE` handler to also delete associated records from the `resource_history` and `leaderboard` tables. This logic is now wrapped in a database transaction."
        },
        {
          "type": "bugfix",
          "description": "Added robust input validation to the leaderboard API route, including an allowlist for `timeFilter` and fallbacks for `limit`, `page`, and `pageSize` to prevent `NaN` errors from invalid user input."
        }
      ]
    },
    {
      "version": "4.0.7",
      "date": "2025-10-07",
      "title": "Dynamic Update Thresholds, Testing, and Dependency Upgrades",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "Implemented dynamic 'needs updating' logic using different time thresholds for resources: Non-priority items are flagged after 7 days of inactivity, while Priority items retain the original 24-hour threshold. This involved removing the unused `isResourceStale` function and `STALE_THRESHOLD_MS` constant, and updating the UI to use the new logic for styling and dynamic tooltips."
        },
        {
          "type": "improvement",
          "description": "Enhanced the 'What's New' modal with a new 'Bug' icon (from lucide-react) that links directly to the project's GitHub issues page with a 'Report a Bug' tooltip. The tooltip for the existing GitHub icon was also updated to 'Visit project Github'."
        },
        {
          "type": "improvement",
          "description": "Overhauled the `README.md` and other documentation for better clarity and completeness."
        },
        {
          "type": "improvement",
          "description": "Significantly improved development tooling by adding test coverage for core libraries and configuring SWC for use with Jest to enhance testing speed and setup."
        },
        {
          "type": "other",
          "description": "Upgraded core development dependencies, including ESLint and `eslint-config-next`, to v9. This resolves several npm warnings related to deprecated packages."
        }
      ]
    },
    {
      "version": "4.0.6",
      "date": "2025-10-02",
      "title": "Admin Override, Framework Upgrades, and Fixes",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "Administrators can now update resource quantities on behalf of other users via a new dropdown in the 'Add/Remove' modal. The backend API (`PUT /api/resources/[id]`) was updated to accept an `onBehalfOf` parameter, and an audit note is automatically appended to the reason when this feature is used."
        },
        {
          "type": "improvement",
          "description": "The application core frameworks have been upgraded to React 19.2.0 and Next.js 15.1.1. This includes updating dynamic API route handlers to correctly process asynchronous parameters and removing the unused `@types/react` and `@types/react-dom` packages."
        },
        {
          "type": "bugfix",
          "description": "Fixed a bug where the congratulations popup was not appearing after a resource update. The `handleUpdate` function in `ResourceTable.tsx` now correctly uses the `pointsEarned` from the API response to trigger the popup."
        }
      ]
    },
    {
      "version": "4.0.5",
      "date": "2025-09-29",
      "title": "Notes Feature, Modal Sizing, and Backdrop Fix",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "An optional 'Notes' textarea has been added to the 'Add/Remove' and 'Set Qty' modals, allowing users to provide a reason (up to 250 characters) for quantity changes. This input is saved to the `reason` column in the `resource_history` table, and the resource history display has been updated to ensure the text wraps and is fully visible."
        },
        {
          "type": "improvement",
          "description": "The width of `UpdateQuantityModal`, `ChangeTargetModal`, `TransferModal`, `EditResourceModal`, and `CongratulationsPopup` has been increased on desktop and larger screens to improve usability."
        },
        {
          "type": "bugfix",
          "description": "Fixed an issue where a modal could unintentionally close if a user clicked down on the modal content and released the click on the backdrop. This was resolved by replacing the `onClick` handler on modal backdrops with `onMouseDown`."
        },
        {
          "type": "other",
          "description": "Bumped drizzle-kit from 0.31.4 to 0.31.5."
        }
      ]
    },
    {
      "version": "4.0.2",
      "date": "2025-09-03",
      "title": "Modal Overhaul, Accessibility Improvements, and Bug Fixes",
      "type": "patch",
      "changes": [
        {
          "type": "feature",
          "description": "The 'What's New' modal has been overhauled to handle long content gracefully. It now uses a flexbox layout to ensure the header and footer are always visible, and the content area is scrollable. Long content is initially collapsed with a 'See More' button to expand it. This also includes smooth expand/collapse animations and fixes for a visual flash on initial render. The modal also now correctly dismisses permanently when closed via the 'X' button or backdrop."
        },
        {
          "type": "feature",
          "description": "Replaced the hardcoded SVGs in the delete confirmation modal with `AlertTriangle` and `Trash2` icons from the `lucide-react` library. This ensures consistent icon usage across the application, including the `ResourceTable` component and the resource detail page."
        },
        {
          "type": "improvement",
          "description": "Improved the accessibility and user experience of all modals by adding `role=\"dialog\"`, `aria-modal=\"true\"`, and `aria-labelledby` attributes for better screen reader support. Modals can now be closed by clicking the overlay without closing when clicking the content itself."
        },
        {
          "type": "improvement",
          "description": "Refactored the activity chart colors on the resource detail page from hardcoded hex strings to a reusable `CHART_COLORS` constant object, which improves maintainability."
        },
        {
          "type": "bugfix",
          "description": "Fixed an issue where the legend circles on the activity timeline would get squished on narrower viewports by adding the `flex-shrink-0` utility class."
        },
        {
          "type": "bugfix",
          "description": "Ensured the progress bar is always visible on the resource detail page when a target is set, even if the progress is 0%, by correcting a conditional render check."
        }
      ]
    },
    {
      "version": "4.0.0",
      "date": "2025-09-02",
      "title": "Priority Resource Flag Addition",
      "type": "major",
      "changes": [
        {
          "type": "feature",
          "description": "Added a new 'isPriority' boolean flag for resources. This includes adding an 'isPriority' column to the database schema, updating the EditResourceModal with a checkbox, adding a visual indicator (asterisk) for priority resources, and implementing a filter to show only priority resources. The API has also been updated to handle this new field."
        },
        {
          "type": "info",
          "description": "If you upgraded from 3.x to 4.x, please refer to the [Database Migration Guide](https://github.com/sininspira2/ResourceTracker/blob/10039cb54c2a1a5c04cae2102390d71bf391a529/DB_MIGRATION.md)."
        }
      ]
    },
    {
      "version": "3.2.7",
      "date": "2025-09-01",
      "title": "Mobile View Navigation Bar Fixes",
      "type": "minor",
      "changes": [
        {
          "type": "bugfix",
          "description": "Fixed long organization names in the `ClientNavigation` component overflowing their container in mobile view."
        },
        {
          "type": "bugfix",
          "description": "Fixed 'Back to Dashboard' links on the activity and privacy pages to be more mobile-friendly."
        },
        {
          "type": "enhancement",
          "description": "Added lucide-react dependency. Necessary for above fixes, and enables access to a lightweight open-source vector graphic library for later updates."
        }
      ]
    },
    {
      "version": "3.2.7",
      "date": "2025-08-31",
      "title": "Full Action Controls, UI/UX Improvements, and Bug Fixes on Resource Details Page",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "The Resource Details page is now equipped with the complete set of action buttons previously only available on the main resource table. Users can now directly 'Add/Remove', 'Set Quantity', 'Transfer', 'Set Target', 'Edit', and 'Delete' resources from the details view, respecting all existing user permissions."
        },
        {
          "type": "improvement",
          "description": "The new action buttons on the details page feature a fully responsive layout. They are neatly arranged in a grid that works on both desktop and mobile, ensuring a great user experience on any device."
        },
        {
          "type": "improvement",
          "description": "The action buttons now maintain a uniform height and width, even on mobile devices where text wrapping might occur, providing a cleaner and more professional look."
        },
        {
          "type": "improvement",
          "description": "To optimize for smaller screens, the icons inside the action buttons on the Resource Details page are now hidden on mobile view, providing more space for the text labels."
        },
        {
          "type": "improvement",
          "description": "Long text and URLs in the resource description field will now correctly wrap to the next line, preventing horizontal overflow and improving readability on mobile devices."
        },
        {
          "type": "improvement",
          "description": "The 'Resource Details' title is now centered on the page, particularly in desktop view."
        },
        {
          "type": "bugfix",
          "description": "Corrected a permission issue on the Resource Details page where the 'Transfer' button was only visible to administrators. It is now correctly shown to all users with editing permissions, matching the behavior of the main resource table."
        },
        {
          "type": "bugfix",
          "description": "Fixed several modal-related prop and handler bugs on the resource details page, including a JSON parsing error, incorrect prop names, and an extra `session` prop."
        }
      ]
    },
    {
      "version": "3.2.6",
      "date": "2025-08-31",
      "title": "Centered Title and Action Buttons on Resource Details Page",
      "type": "patch",
      "changes": [
        {
          "type": "feature",
          "description": "Action buttons for updating quantity, setting a target, and transferring resources have been added to the resource detail page."
        },
        {
          "type": "improvement",
          "description": "The 'Resource Details' title is now centered on the resource detail page (particularly on desktop). The newly added action buttons have the same functionality and permission checks as their counterparts on the main resource table and are responsively styled to appear correctly on both mobile and desktop views."
        }
      ]
    },
    {
      "version": "3.2.5",
      "date": "2025-08-28",
      "title": "Improved Activity Chart and Bug Fixes",
      "type": "patch",
      "changes": [
        {
          "type": "feature",
          "description": "The activity timeline chart on the resource detail page now displays three separate lines for Hagga, Deep Desert, and the total quantity. The chart's y-axis scaling is updated to accommodate all three data series, and a legend has been added. The y-axis now also displays four dynamically calculated labels."
        },
        {
          "type": "bugfix",
          "description": "Corrected an issue where the 'Target' column was not visible for users who lack edit target permissions."
        }
      ]
    },
    {
      "version": "3.2.4",
      "date": "2025-08-27",
      "title": "Improved Target Quantity Editing and User Data Export",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "Replaced inline text input for editing a resource's target quantity with a new modal-based approach. The ResourceTable component now displays the target quantity as plain text in the table view. A new 'Set Target' button has been added next to the 'Transfer' button in both grid and table views for users with target editing permissions. Clicking this button opens a new ChangeTargetModal for inputting a new target quantity."
        },
        {
          "type": "feature",
          "description": "Added the ability for users with hasUserManagementAccess to export data for any user. A new API route app/api/users/[userId]/data-export/route.ts was added, and the UserTable component now includes an 'Export Data' button on each row for authorized users. The button triggers a download of the user's data as a JSON file."
        },
        {
          "type": "improvement",
          "description": "The 'Set' button for quantity is now labeled 'Set Qty'."
        },
        {
          "type": "improvement",
          "description": "The 'Set Target' button is now styled with an orange color."
        },
        {
          "type": "improvement",
          "description": "In the table view, the 'Resource' column is narrower with text wrapping, and the 'Actions' column is wider."
        },
        {
          "type": "improvement",
          "description": "The table layout is set to table-fixed to ensure column widths are respected."
        },
        {
          "type": "improvement",
          "description": "Action buttons in the table view have a min-w-20 to ensure they have a sensible minimum width."
        },
        {
          "type": "improvement",
          "description": "Bumped @libsql/client from 0.15.12 to 0.15.14, @types/node from 22.17.2 to 22.18.0, and drizzle-orm from 0.44.4 to 0.44.5."
        },
        {
          "type": "bugfix",
          "description": "Corrected missing useEffect dependencies in react."
        }
      ]
    },
    {
      "version": "3.2.2",
      "date": "2025-08-21",
      "title": "Improve UpdateQuantityModal functionality",
      "type": "minor",
      "changes": [
        {
          "type": "improvement",
          "description": "Replaced the 'Update' button in UpdateQuantityModal with distinct 'Add' and 'Remove' buttons for relative updates."
        },
        {
          "type": "improvement",
          "description": "The UpdateQuantityModal input field now prevents negative values, ensuring data integrity."
        }
      ]
    },
    {
      "version": "3.2.1",
      "date": "2025-08-21",
      "title": "User Management Page Added",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "Added a \"User Management\" page for users with canManageUsers permission set to True in environment variables."
        },
        {
          "type": "improvement",
          "description": "Moved from Node.js 20.x (Maintenence LTS) to 22.x (Active LTS)."
        },
        {
          "type": "improvement",
          "description": "Bumped some minor package dependency versions and changed package.json and package-lock.json to better reflect application dependencies and dev dependencies."
        },
        {
          "type": "improvement",
          "description": "Minor aesthetic change to Dashboard SVG icons."
        }
      ]
    },
    {
      "version": "3.1.0",
      "date": "2025-08-19",
      "title": "Database Performance and New Features",
      "type": "minor",
      "changes": [
        {
          "type": "feature",
          "description": "Added a category filter to the resource table."
        },
        {
          "type": "feature",
          "description": "Added a \"Blueprints\" category for organizing resources."
        },
        {
          "type": "improvement",
          "description": "Text added to the \"Description\" field of a resource is now parsed and automatically linkifieid with anchor tags."
        },
        {
          "type": "improvement",
          "description": "Optimized database performance with atomic transactions for resource updates and faster leaderboard queries."
        },
        {
          "type": "improvement",
          "description": "Lazy-loaded the database connection to speed up initial application response."
        },
        {
          "type": "improvement",
          "description": "Refactored internal code by centralizing constants for better maintainability."
        },
        {
          "type": "bugfix",
          "description": "Corrected an issue where permissions were not being properly checked on the server side."
        },
        {
          "type": "bugfix",
          "description": "Resolved warnings related to Discord role configuration parsing."
        },
        {
          "type": "bugfix",
          "description": "Addressed minor issues in the new inventory transfer modal."
        }
      ]
    },
    {
      "version": "3.0.0",
      "date": "2025-08-11",
      "title": "Dual-inventory tracking addition",
      "type": "major",
      "changes": [
        {
          "type": "feature",
          "description": "Added dual-tracking for DD and Hagga Bases"
        },
        {
          "type": "bugfix",
          "description": "Fixed bulk metadata update"
        }
      ]
    }
  ]
}
```

-----

## 🚀 Release Notes - Version 4.1.1: Comprehensive Theming System and UI Refactoring

**Release Date:** October 16, 2025

---

### ✨ New Features

#### Comprehensive Theming System Implementation
A robust theming system has been implemented across the application using **Tailwind CSS custom properties (CSS variables)**, transitioning away from hardcoded color values.

* **Light/Dark Mode Management:** The system allows for easy and centralized management of light and dark modes across the application.
* **Refactored UI Components:** All major UI components, including modals, navigation, tables, and dashboards, have been refactored to utilize the new theme variables, ensuring a **consistent visual experience** and **improved scalability**.
* **Centralized Definitions:** Color definitions are now centralized in `app/globals.css` and mapped in `tailwind.config.ts`, simplifying future color adjustments and maintenance.

### 🚀 Improvements

* **Smoother Theme Switching:** The theme switching logic was enhanced with a **pre-hydration script** to prevent visual flickering during initial page loads, providing a smoother user experience.
* **Semantic Color Naming:** CSS color variables in `tailwind.config.ts` and `app/globals.css` were refactored for **improved modularity and semantic naming**. Generic variables like `--color-background-modal-content` have been replaced with more descriptive names such as `--color-tile-background`.
* **Consistent Code Style:** **Prettier** and the **Tailwind CSS plugin** were added to the project to enforce a consistent code style. The entire codebase was formatted with the new setup, specifically **reordering Tailwind CSS classes for uniformity**.
---

## 🚀 Release Notes - Version 4.1.0: Vercel Data Cache, Improved Migrations, and API Stability

**Release Date:** October 10, 2025

---

### ✨ Architectural Features

#### Improved Database Migration System

The database migration tracking system has been completely overhauled from a manual, tag-based approach to an **improved, hash-based system**.

- **Simplified Workflow:** The new system simplifies the database workflow for users, who can now handle all subsequent migrations using a single command: `npm run db:migrate`.
- **Integrity and Consistency:** The system now automatically calculates the SHA256 hash of each migration file, ensuring cross-platform consistency.
- **Schema Update:** The database schema now includes a new `global_settings` table and new `tier`/`subcategory` columns in the `resources` table. **These columns are included to support future features** but allow for more granular classification.

#### Vercel Data Cache Implementation

All API routes have been refactored to utilize **Vercel's fetch-based Data Cache**, resulting in significant performance gains and reduced load times.

- **Caching Strategy:** `GET` API routes have been refactored to use a public/internal pattern to leverage this new caching strategy with appropriate revalidation times.
- **Security and Authentication:**
  - Application protection logic was simplified by replacing the old middleware with a lightweight 'include list'.
  - **Fixed a critical 401 error** by ensuring 'cookie' and 'authorization' headers are correctly forwarded in internal API calls when using Vercel Authentication.

### 🐛 Critical Bug Fixes & Stability

- **Next.js 15 Compatibility:** Resolved persistent build errors by updating all dynamic API route handlers to correctly use the **asynchronous `params` object signature** required by Next.js 15.
- **Data Integrity on Deletion:** Ensured database integrity during resource deletion by updating the `DELETE` handler to also delete associated records from the `resource_history` and `leaderboard` tables. This logic is now safely wrapped in a **database transaction**.
- **Leaderboard Validation:** Added robust input validation to the leaderboard API route, including an allowlist for the `timeFilter` parameter and fallbacks for other parameters to prevent `NaN` errors from invalid input.

_See `lib/changelog.json` for previous update history._

---

![Resource Page Example](https://raw.githubusercontent.com/sininspira2/ResourceTracker/main/ResourcesPageSample.png)
_The main resource management grid._

![Resource Details Example](https://raw.githubusercontent.com/sininspira2/ResourceTracker/main/ResourceDetailsSample.png)
_Detailed view with activity timeline and contribution stats._

## ✨ Features

- **Discord OAuth Authentication** - Secure login with Discord.
- **Role-Based Access Control** - Granular permissions managed through your Discord server roles.
- **Resource Management** - Track quantities across two locations with visual status indicators.
- **Activity Logging** - Complete audit trail of all user actions with time filtering.
- **GDPR Compliance** - Tools for user data export and deletion.
- **Grid & Table Views** - Multiple layouts to view and manage resources.
- **Interactive Charts** - Visualize resource history with interactive data points.
- **Gamification** - A points-based leaderboard system to encourage contributions.
- **Admin Controls** - Full control over resources, targets, and user data for authorized roles.
- **Responsive Design** - Modern UI optimized for desktop and mobile devices.

---

## 🚀 Free Deployment Guide

This guide will walk you through deploying your own instance of the Resource Tracker for free using Vercel and Turso.

### ✅ Prerequisites

Before you start, make sure you have the following installed:

1.  **Node.js**: Version 22.x LTS is required. You can download it from [nodejs.org](https://nodejs.org/).
2.  **Git**: Required for cloning the repository. Download it from [git-scm.com](https://git-scm.com/downloads).
3.  **A code editor**: Such as [VS Code](https://code.visualstudio.com/).

### Step 1: Fork and Clone the Repository

1.  **Fork the project**: Click the "Fork" button at the top-right of this page to create your own copy.
2.  **Clone your fork**: Open your terminal or command prompt and run the following command, replacing `YOUR_USERNAME` with your GitHub username:
    ```bash
    git clone https://github.com/YOUR_USERNAME/ResourceTracker.git
    cd ResourceTracker
    ```

### Step 2: Set Up Discord OAuth

1.  Navigate to the [Discord Developer Portal](https://discord.com/developers/applications) and click **"New Application"**.
2.  Give your application a name (e.g., "My Guild's Resource Tracker").
3.  Go to the **"OAuth2"** tab.
4.  Copy the **Client ID** and **Client Secret**. You will need these later.
5.  Under **Redirects**, add the following URL: `http://localhost:3000/api/auth/callback/discord`. We will update this with our production URL later.

### Step 3: Get Discord Server Details

1.  **Enable Developer Mode** in Discord: Go to `User Settings > Advanced` and turn on "Developer Mode".
2.  **Copy Server ID**: Right-click your Discord server icon and select "Copy Server ID".
3.  **Copy Role IDs**: In your server settings, go to `Roles`, right-click a role you want to configure, and select "Copy ID". You'll need at least one role for basic access. For more details, see the [role configuration guide](./docs/debug-discord-roles.md).

### Step 4: Create a Free Turso Database

1.  Sign up for a free account at [turso.tech](https://turso.tech). The free tier is very generous.
2.  Click **"Create Database"**.
3.  Choose a name (e.g., `resource-tracker-db`) and select the region closest to you.
4.  Once created, copy the **Database URL** (starts with `libsql://`) and generate and copy an **Auth Token**.

### Step 5: Initial Vercel Deployment

1.  Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
2.  Click **"Add New... > Project"** and import your forked repository.
3.  In the "Configure Project" screen, expand the **Environment Variables** section. Add all variables from the table below, **but leave `NEXTAUTH_URL` empty for now.**

| Variable Name           | Value                         | Description                                                                        |
| :---------------------- | :---------------------------- | :--------------------------------------------------------------------------------- |
| `DISCORD_CLIENT_ID`     | _From Step 2_                 | Your Discord application's Client ID.                                              |
| `DISCORD_CLIENT_SECRET` | _From Step 2_                 | Your Discord application's Client Secret.                                          |
| `DISCORD_GUILD_ID`      | _From Step 3_                 | Your Discord server's ID.                                                          |
| `DISCORD_ROLES_CONFIG`  | _See note below_              | **Single-line JSON** for role permissions. See [ENVIRONMENT.md](./ENVIRONMENT.md). |
| `NEXTAUTH_URL`          | **Leave this blank for now.** | The production URL of your Vercel app.                                             |
| `NEXTAUTH_SECRET`       | _Generate a secret_           | Run `openssl rand -base64 32` in your terminal to create one.                      |
| `TURSO_DATABASE_URL`    | _From Step 4_                 | Your Turso database URL.                                                           |
| `TURSO_AUTH_TOKEN`      | _From Step 4_                 | Your Turso database authentication token.                                          |
| `NEXT_PUBLIC_ORG_NAME`  | _Your choice_                 | Your community or organization's name.                                             |

> **Important**: For `DISCORD_ROLES_CONFIG`, the JSON must be on a single line. Start with a simple configuration for a single admin role:
> `[{"id":"YOUR_ADMIN_ROLE_ID","name":"Admin","level":100,"isAdmin":true,"canAccessResources":true,"canEditTargets":true}]`

4.  Click **Deploy**.
5.  **Set Node.js Version**: After the first deployment, go to your project's **Settings > General** on Vercel, set the **Node.js Version** to **22.x**.

### Step 6: Configure Production URL

1.  Once the deployment is complete, go to your project's dashboard on Vercel and copy the primary domain (e.g., `https://your-project.vercel.app`).
2.  Go back to your project's **Settings > Environment Variables**.
3.  Add a new environment variable: `NEXTAUTH_URL` and paste the domain you just copied.
4.  **Redeploy**: Go to the **Deployments** tab, click the latest deployment, and select "Redeploy" from the menu. This ensures the new `NEXTAUTH_URL` variable is applied.

### Step 7: Initialize the Database

1.  **Install dependencies locally**: From the local pronect folder that you cloned in Step 1:
    ```bash
    npm install
    ```
2.  **Create `.env.local` file**: In your local project folder, create a file named `.env.local` and add your Turso credentials:
    ```
    TURSO_DATABASE_URL=your_turso_database_url
    TURSO_AUTH_TOKEN=your_turso_auth_token
    ```
3.  **Run the Database Migration**: This command creates and sets up the database schema.
    ```bash
    # Applies all existing migrations to create the schema and logs them.
    npm run db:migrate
    ```

### Step 8: Populate with Sample Data (Optional)

You can add some initial data to see how the application works.

```bash
# For Dune-specific resources
npm run populate-resources-dune

# For Tier-6 Blueprints
npm run populate-blueprints-dune
```

### Step 9: Finalize Discord Configuration

1.  Go back to the [Discord Developer Portal](https://discord.com/developers/applications) and select your application.
2.  In the **"OAuth2"** tab, under **Redirects**, add your production Vercel URL you configured in Step 6:
    `https://your-app-name.vercel.app/api/auth/callback/discord`

### 🎉 You're Done!

Your Resource Tracker is now live! Visit your Vercel URL to sign in with Discord.

---

## 🛠️ Local Development

For contributing or making customizations, follow these steps to run the project locally.

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Configure environment**: Create a `.env.local` file in the root of your project. This file stores your secret keys and configuration for local development. Copy the example below and fill in your actual values.

    ```bash
    # .env.local

    # Discord OAuth (from your Discord Developer Application)
    DISCORD_CLIENT_ID=your_discord_client_id
    DISCORD_CLIENT_SECRET=your_discord_client_secret
    DISCORD_GUILD_ID=your_discord_server_id

    # Discord Roles (single-line JSON - see ENVIRONMENT.md for details)
    # Example with an Admin and a Member role:
    DISCORD_ROLES_CONFIG=[{"id":"1234567890","name":"Admin","level":100,"isAdmin":true,"canEditTargets":true,"canAccessResources":true},{"id":"0987654321","name":"Member","level":1,"isAdmin":false,"canEditTargets":false,"canAccessResources":true}]

    # NextAuth (generate secret with: openssl rand -base64 32)
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_super_secret_key_generated_with_openssl

    # Turso Database (from your Turso dashboard)
    TURSO_DATABASE_URL=libsql://your-database.turso.io
    TURSO_AUTH_TOKEN=your_turso_auth_token

    # Optional: Customize branding for your local instance
    NEXT_PUBLIC_ORG_NAME=Dev Community
    ```

    For a detailed explanation of all variables, see [ENVIRONMENT.md](./ENVIRONMENT.md).

3.  **Set up the database**:
    ```bash
    # Applies all existing migrations to create the schema and logs them.
    npm run db:migrate
    ```
4.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

---

## 🎨 Customization

This application is designed to be easily customized:

- **Branding**: Set `NEXT_PUBLIC_ORG_NAME` for your organization's name.
- **Roles**: Configure permissions in `DISCORD_ROLES_CONFIG`.
- **Resources**: Modify the population scripts in the `/scripts` folder to fit your needs.
- **Styling**: Update colors and themes in `tailwind.config.js` and `app/globals.css`.

For more details, see the [Customization Guide](./docs/customization-guide.md).

## 📚 Documentation

- [**ENVIRONMENT.md**](./ENVIRONMENT.md): Full guide to all environment variables.
- [**DB_MIGRATION.md**](./DB_MIGRATION.md): **IMPORTANT** guide for users upgrading from older versions.
- [**CONTRIBUTING.md**](./CONTRIBUTING.md): Guidelines for contributing to the project.
- [**docs/**](./docs/): In-depth documentation on architecture, API, and more.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sininspira2/ResourceTracker)
