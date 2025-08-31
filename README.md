# Resource Tracker

A comprehensive resource management and tracking portal with Discord authentication and role-based access control. Perfect for gaming communities, organizations, and teams that need to track shared resources, inventory, or assets.

Made for Dune: Awakening. Originally forked from https://github.com/theyetty and adapted to the specific needs of my guild.

Removed from fork network due to original author repository being deleted, and database/backend changes incompatible with other forks.

## 🚀 Release Notes - Version 3.2.7

**Release Date:** August 31, 2025

---

### ✨ New Features

* **Full Action Controls on Resource Details Page:** The Resource Details page is now equipped with the complete set of action buttons previously only available on the main resource table. Users can now directly "Add/Remove", "Set Quantity", "Transfer", "Set Target", "Edit", and "Delete" resources from the details view, respecting all existing user permissions.

### 🚀 Improvements

* **Responsive Layout for Action Buttons:** The new action buttons on the details page feature a fully responsive layout. They are neatly arranged in a grid that works on both desktop and mobile, ensuring a great user experience on any device.
* **Uniform Button Sizing:** The action buttons now maintain a uniform height and width, even on mobile devices where text wrapping might occur, providing a cleaner and more professional look.
* **Cleaner Mobile Interface:** To optimize for smaller screens, the icons inside the action buttons on the Resource Details page are now hidden on mobile view, providing more space for the text labels.
* **Improved Text Wrapping:** Long text and URLs in the resource description field will now correctly wrap to the next line, preventing horizontal overflow and improving readability on mobile devices.
* **Centered Title:** The 'Resource Details' title is now centered on the page, particularly in desktop view.

### 🐛 Bug Fixes

* **Corrected "Transfer" Button Visibility:** Fixed a permission issue on the Resource Details page where the "Transfer" button was only visible to administrators. It is now correctly shown to all users with editing permissions, matching the behavior of the main resource table.
* **Modal Prop and JSON Fixes:** Resolved several issues with modal components and their interaction with the API, including a JSON parsing error, incorrect prop names, and an unnecessary `session` prop.

## 🚀 Release Notes - Version 3.2.5

**Release Date:** August 28, 2025

---

### New Features
* **Improved Activity Chart:** The activity timeline chart on the resource detail page now shows three distinct lines—one for Deep Desert, one for Hagga, and a total quantity line—each with a unique color. The chart's scaling and y-axis labels have been optimized to better display all three data sets. A legend has also been added to help identify each line.

### Bug Fixes
* **Target Column Visibility:** Fixed a bug where the "Target" column was not showing for users who do not have permissions to edit targets.

## 🚀 Release Notes - Version 3.2.4

**Release Date:** August 27, 2025

---

### Key Features
* **Improved Target Quantity Editing:** The inline text input for a resource's target quantity has been replaced with a new modal. The **ResourceTable** component now shows the target as plain text, and a new **'Set Target'** button has been added to both the grid and table views. Clicking this button opens a new **ChangeTargetModal** to set the quantity.
* **User Data Export:** Users with **hasUserManagementAccess** can now export data for any user. A new API route, `app/api/users/[userId]/data-export/route.ts`, handles the export, and the **UserTable** component now includes an **'Export Data'** button for authorized users.

### Improvements & Fixes
* The button for setting quantity has been relabeled from "Set" to **"Set Qty"**.
* The new **"Set Target"** button is styled with an orange color for better visibility.
* The table view's layout has been adjusted: the **"Resource"** column is narrower with text wrapping, and the **"Actions"** column is wider.
* The table layout is now set to `table-fixed` to ensure consistent column widths.
* Action buttons in the table view now have a minimum width of `20` units (`min-w-20`).
* Dependency versions were updated: `@libsql/client` from 0.15.12 to 0.15.14, `@types/node` from 22.17.2 to 22.18.0, and `drizzle-orm` from 0.44.4 to 0.44.5.
* Fixed a bug where `useEffect` in React was missing dependencies.
 
*See lib/changelog.json for previous update history*

----------------------------------------------------------------------------------------

## Features

- **Discord OAuth Authentication** - Secure login with Discord
- **Role-Based Access Control** - Permissions managed through Discord server roles
- **Resource Management** - Track quantities, categories, and changes with visual status indicators
- **Activity Logging** - Complete audit trail of all user actions with time filtering
- **GDPR Compliance** - Data export and deletion tools for privacy compliance
- **Grid & Table Views** - Multiple ways to view and manage resources
- **Real-Time Updates** - Live status changes and animations
- **Interactive Charts** - Resource history visualization with hover details
- **Admin Controls** - Target quantity management for authorized roles
- **Responsive Design** - Modern UI optimized for all devices

## GDPR & Privacy Features

- **Data Export** - Users can download all their data in JSON format
- **Data Deletion** - Request anonymization of personal data
- **Activity Transparency** - View complete history of actions taken
- **Privacy Controls** - Clear data retention policies and user rights

## 🆓 Deploy for Free (Recommended)

### Step 1: Fork the Repository
1. Click the "Fork" button at the top of this GitHub repository
2. Clone your fork to your local machine:
```bash
git clone https://github.com/YOUR_USERNAME/ResourceTracker.git
cd ResourceTracker
```

### Step 2: Set up Discord OAuth Application
1. Go to https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to **OAuth2 → General**:
   - Copy the **Client ID** and **Client Secret** (save these for later)
4. Go to **OAuth2 → Redirects**:
   - Add redirect URI: `https://your-app-name.vercel.app/api/auth/callback/discord`
   - Replace `your-app-name` with your planned Vercel app name
5. Go to **Bot** (optional, for advanced Discord integration)

### Step 3: Get Discord Server Details
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your Discord server → "Copy Server ID" (this is your `DISCORD_GUILD_ID`)
3. Right-click on roles you want to use → "Copy ID" (for `DISCORD_ROLES_CONFIG`)

### Step 4: Create Free Turso Database
1. Go to https://turso.tech and sign up (free tier: 500 databases, 1B row reads/month)
2. Click "Create Database"
3. Choose a database name (e.g., `resource-tracker-db`)
4. Select the closest region to your users
5. After creation, click on your database
6. Copy the **Database URL** (starts with `libsql://`)
7. Click "Create Token" and copy the **Auth Token**

### Step 5: Deploy to Vercel
1. Go to https://vercel.com and sign up with your GitHub account
2. Click "New Project" and import your forked repository
3. In the deployment settings, add these **Environment Variables**:

```bash
# Discord OAuth (from Step 2)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_GUILD_ID=your_discord_server_id

# Discord Roles (single line JSON - see ENVIRONMENT.md for details)
DISCORD_ROLES_CONFIG=[{"id":"your_role_id","name":"Admin","level":100,"isAdmin":true,"canAccessResources":true}]

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_long_random_secret_here

# Turso Database (from Step 4)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Optional: Customize branding
NEXT_PUBLIC_ORG_NAME=Your Community Name
```

4. Click **Deploy**

***Vercel Project Settings Note: Under "Settings" -> "Build and Deployment", make sure "Node.js Version" is set to "22.x". Redeploy the production build if necessary.***

### Step 6: Initialize Database Schema
After deployment, you need to set up your database tables:

1. Install Drizzle CLI locally:
```bash
npm install -g drizzle-kit
```

2. Clone your repository and install dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/ResourceTracker.git
cd ResourceTracker
npm install
```

3. Create a `.env.local` file with your Turso credentials:
```bash
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
```

4. Run the database migration:
```bash
npm run db:push
```

### Step 7: Populate with Sample Data (Optional)
Add some initial resources to test the app:

```bash
npm run populate-resources-safe
```

### Step 8: Update Discord OAuth Redirect
Go back to your Discord application and update the redirect URI to match your deployed Vercel URL:
- `https://your-actual-vercel-url.vercel.app/api/auth/callback/discord`

### 🎉 You're Done!
Your Resource Tracker is now running for free! Visit your Vercel URL and sign in with Discord.

**Free Tier Limits:**
- **Vercel**: 100GB bandwidth, unlimited projects
- **Turso**: 500 databases, 1B row reads, 1M row writes/month
- **Discord**: Unlimited OAuth usage

---

## 🛠️ Local Development Setup

For local development:

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with the environment variables (see [ENVIRONMENT.md](./ENVIRONMENT.md) for details)

3. Run database migrations:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

## Customization

This application is designed to be easily customizable for any organization or community:

- **Branding**: Set `NEXT_PUBLIC_ORG_NAME` to customize organization name
- **Roles**: Configure Discord roles via `DISCORD_ROLES_CONFIG` 
- **Resources**: Modify resource categories and types to fit your needs
- **Styling**: Update themes and colors in Tailwind configuration

See [ENVIRONMENT.md](./ENVIRONMENT.md) for all configuration options.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Discord provider
- **Database**: Turso (SQLite), Drizzle ORM
- **Deployment**: Vercel-ready
- **Privacy**: GDPR-compliant data handling

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is open source. See [LICENSE](./LICENSE) for more information. 
