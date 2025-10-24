# 🚨⚠️Users Moving from the old tracker, and those updating from 3.x to 4.x - please refer to the [Database Migration Guide](./DB_MIGRATION.md).⚠️🚨

# Resource Tracker

A comprehensive resource management and tracking portal with Discord authentication and role-based access control. Perfect for gaming communities, organizations, and teams that need to track shared resources, inventory, or assets.

Made for Dune: Awakening. Originally forked from `https://github.com/theyetty` and adapted to the specific needs of my guild.

Removed from fork network due to original author repository being deleted, and database/backend changes incompatible with other forks.

---

## 🚀 Release Notes - Version 4.1.3: Resource Tier System and Multi-Select Filtering

**Release Date:** October 24, 2025

### ✨ New Features

#### Resource Tier System

This release introduces a new **'tier' attribute** for resources, allowing for a more granular classification based on importance or progression level.

-   **Tier Management:** The 'Edit Resource' modal has been updated to allow users to assign a tier to any resource.
-   **Enhanced UI:** Resource detail pages now display the assigned tier with distinct styling, making it easy to identify a resource's classification at a glance.

#### Advanced Multi-Select Filtering

The filtering system on the resource table has been significantly upgraded to provide more powerful and flexible data organization.

-   **Multi-Select:** Users can now select multiple options simultaneously for the **Status**, **Category**, and new **Tier** filters.
-   **New Component:** This feature is powered by a new `MultiSelectDropdown` component for a clean and intuitive user experience.


### ❗ Important Notes

#### Database Migration

This update utilizes the `tier` column in the database, which was added in **version 4.1.0**.

A database migration is **not required** for this update *unless* you are updating from a version prior to 4.1.0 **and** you see a yellow warning banner displayed above the navigation bar. If you do not see this banner, your database is already up to date.

---

## 🚀 Release Notes - Version 4.1.2: CSV Data Import/Export and UI Enhancements

**Release Date:** October 23, 2025

### ✨ New Features

#### Bulk Resource Management via CSV Import/Export

A powerful new bulk data management feature has been added to the Resources page, available for users with `canEditTargets` permissions.

- **Export:** A new **"Export CSV"** button allows users to download the currently filtered list of resources. A confirmation modal displays the total resource count before downloading. The export includes key data: `id`, `name`, `quantityHagga`, `quantityDeepDesert`, and `targetQuantity`.
- **Import:** An **"Import CSV"** button opens a modal to upload a CSV file. The system provides a detailed **preview of all pending changes**, showing the old and new values for each resource to ensure accuracy before confirmation.
- **Transactional Updates:** To ensure data integrity, all changes from an import are processed in a **single database transaction** after the user confirms the preview.
- **API:** This feature is supported by new secure API endpoints at `/api/resources/bulk` and `/api/resources/bulk/confirm`, which are protected by the same permission checks.

### 🚀 Improvements

#### Robust File Validation

The CSV import feature includes multi-layered validation to ensure data quality and security.

- **Client-Side Checks:** The import modal provides immediate user feedback by validating the file for the correct `.csv` extension and a maximum file size of 256KB.
- **Server-Side Checks:** The same validation rules are enforced on the API to prevent circumvention of client-side checks. Invalid files are rejected with a `400 Bad Request` status, with new API tests confirming this behavior.
- **Accessibility:** The import modal's file input is now correctly associated with a `label` for improved screen reader support.

#### Responsive Navigation UI

The main `ClientNavigation` component has been refactored for better usability on different screen sizes.

- **Mobile View:** The version button is now positioned **below** the page title, preventing layout crowding on smaller screens.
- **Desktop View:** The button remains in its original position **next to** the page title.

### 🐛 Bug Fixes

- **Testing Stability:** Resolved a compatibility issue between Jest and `node-fetch v3` to stabilize the testing environment.

### 🔧 Other Changes

- **Test Coverage:** Added test coverage for API routes and core components.
- **CI/CD Pipeline:** Updated the `ci.yml` workflow to include Vercel notifications and ensure `npm install` is used.
- **Dependencies:** Bumped development dependencies, including `@types/node` to `22.18.12`.
- **Code Style:** Ran `prettier` across the codebase to ensure consistent formatting.

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
