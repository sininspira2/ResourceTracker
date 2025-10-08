# 🚨⚠️Users Moving from the old tracker, and those updating from 3.x to 4.x - please refer to the [Database Migration Guide](./DB_MIGRATION.md).⚠️🚨

# Resource Tracker

A comprehensive resource management and tracking portal with Discord authentication and role-based access control. Perfect for gaming communities, organizations, and teams that need to track shared resources, inventory, or assets.

Made for Dune: Awakening. Originally forked from `https://github.com/theyetty` and adapted to the specific needs of my guild.

Removed from fork network due to original author repository being deleted, and database/backend changes incompatible with other forks.

---

## 🚀 Release Notes - Version 4.0.7: Dynamic Thresholds, Testing, and Dependency Upgrades

**Release Date:** October 7, 2025

---

### ✨ New Features

#### Dynamic 'Needs Updating' Time Thresholds

This release introduces new logic to differentiate how long a resource can go without an update before it's flagged as "needs updating" on the dashboard, making tracking more intelligent and customizable.

* **Non-Priority Item Threshold:** Items not marked as priority are now flagged as **"needs updating" after 7 days** of inactivity.
* **Priority Item Threshold:** Priority items retain the original, more urgent **24-hour threshold** for inactivity.
* **User Interface:** The UI now dynamically applies styling and uses tooltips to display the correct, context-aware time threshold for each resource.
* **Code Cleanup:** The redundant `isResourceStale` function and the unused `STALE_THRESHOLD_MS` constant have been removed, streamlining the codebase.

### 🚀 Improvements

#### What's New Modal Links and Documentation Overhaul

* **Bug Reporting:** The **'What's New' modal** has been enhanced with a new **'Bug' icon** (sourced from `lucide-react`) that provides a direct link to the project's GitHub issues page, complete with a **'Report a Bug'** tooltip.
* **GitHub Link:** The tooltip for the existing GitHub icon has been updated to the clearer **'Visit project Github'**.
* **Documentation:** The project's primary documentation, including the **`README.md`**, has been completely overhauled for improved clarity and comprehensive detail.

#### Testing and Tooling Enhancements

* **Improved Test Coverage:** New test coverage has been added for core application libraries, increasing code reliability.
* **Modern Testing Setup:** The testing environment has been streamlined by configuring **SWC (Speedy Web Compiler) for Jest**, which is expected to significantly improve the performance and setup time of unit tests.

### 🛠️ Other

* **ESLint Version Upgrade:** The linter setup has been updated to use **ESLint v9** and the latest `eslint-config-next`. This change resolves several pending npm warnings related to deprecated packages, ensuring the development environment remains modern and stable.

*See `lib/changelog.json` for previous update history.*

---

![Resource Page Example](https://raw.githubusercontent.com/sininspira2/ResourceTracker/main/ResourcesPageSample.png)
_The main resource management grid._

![Resource Details Example](https://raw.githubusercontent.com/sininspira2/ResourceTracker/main/ResourceDetailsSample.png)
_Detailed view with activity timeline and contribution stats._

## ✨ Features

* **Discord OAuth Authentication** - Secure login with Discord.
* **Role-Based Access Control** - Granular permissions managed through your Discord server roles.
* **Resource Management** - Track quantities across two locations with visual status indicators.
* **Activity Logging** - Complete audit trail of all user actions with time filtering.
* **GDPR Compliance** - Tools for user data export and deletion.
* **Grid & Table Views** - Multiple layouts to view and manage resources.
* **Interactive Charts** - Visualize resource history with interactive data points.
* **Gamification** - A points-based leaderboard system to encourage contributions.
* **Admin Controls** - Full control over resources, targets, and user data for authorized roles.
* **Responsive Design** - Modern UI optimized for desktop and mobile devices.

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
    git clone [https://github.com/YOUR_USERNAME/ResourceTracker.git](https://github.com/YOUR_USERNAME/ResourceTracker.git)
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

| Variable Name          | Value                 | Description                                                              |
| :--------------------- | :-------------------- | :----------------------------------------------------------------------- |
| `DISCORD_CLIENT_ID`    | *From Step 2* | Your Discord application's Client ID.                                    |
| `DISCORD_CLIENT_SECRET`| *From Step 2* | Your Discord application's Client Secret.                                |
| `DISCORD_GUILD_ID`     | *From Step 3* | Your Discord server's ID.                                                |
| `DISCORD_ROLES_CONFIG` | *See note below* | **Single-line JSON** for role permissions. See [ENVIRONMENT.md](./ENVIRONMENT.md). |
| `NEXTAUTH_URL`         | **Leave this blank for now.** | The production URL of your Vercel app.                                   |
| `NEXTAUTH_SECRET`      | *Generate a secret* | Run `openssl rand -base64 32` in your terminal to create one.              |
| `TURSO_DATABASE_URL`   | *From Step 4* | Your Turso database URL.                                                 |
| `TURSO_AUTH_TOKEN`     | *From Step 4* | Your Turso database authentication token.                                |
| `NEXT_PUBLIC_ORG_NAME` | *Your choice* | Your community or organization's name.                                   |

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

1.  **Install dependencies locally**:
    ```bash
    npm install
    ```
2.  **Create `.env.local` file**: In your local project folder, create a file named `.env.local` and add your Turso credentials:
    ```
    TURSO_DATABASE_URL=your_turso_database_url
    TURSO_AUTH_TOKEN=your_turso_auth_token
    ```
3.  **Run the database migration**: This command will create all necessary tables and bring your database schema up-to-date.
    ```bash
    npm run db:migrate
    ```
> **Note for existing users**: If you are updating from a version that did not have a `__drizzle_migrations` table, please refer to the detailed **[Database Migration Guide](./DB_MIGRATION.md)** for instructions on how to baseline your database before running this command.

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
    npm run db:migrate
    ```
> **Note for existing users**: If you are updating from a version that did not have a `__drizzle_migrations` table, please refer to the detailed **[Database Migration Guide](./DB_MIGRATION.md)** for instructions on how to baseline your database before running this command.
4.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

---

## 🎨 Customization

This application is designed to be easily customized:

* **Branding**: Set `NEXT_PUBLIC_ORG_NAME` for your organization's name.
* **Roles**: Configure permissions in `DISCORD_ROLES_CONFIG`.
* **Resources**: Modify the population scripts in the `/scripts` folder to fit your needs.
* **Styling**: Update colors and themes in `tailwind.config.js` and `app/globals.css`.

For more details, see the [Customization Guide](./docs/customization-guide.md).

## 📚 Documentation

* [**ENVIRONMENT.md**](./ENVIRONMENT.md): Full guide to all environment variables.
* [**DB_MIGRATION.md**](./DB_MIGRATION.md): **IMPORTANT** guide for users upgrading from older versions.
* [**CONTRIBUTING.md**](./CONTRIBUTING.md): Guidelines for contributing to the project.
* [**docs/**](./docs/): In-depth documentation on architecture, API, and more.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sininspira2/ResourceTracker)
