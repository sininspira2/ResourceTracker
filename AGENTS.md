# AGENTS.md

This document provides context and instructions for AI coding agents to effectively understand and contribute to the Resource Tracker project.

---

## Project Overview

Resource Tracker is a full-stack web application designed for resource management and tracking, with a strong focus on integration with Discord for authentication and role-based access control (RBAC). It's built with Next.js (App Router), TypeScript, and Tailwind CSS for the frontend, and uses NextAuth.js for authentication. The backend is powered by Next.js API Routes, Drizzle ORM, and a Turso (SQLite) database.

The core functionality revolves around tracking quantities of various resources across two locations ("Haga" and "Deep Desert"), maintaining an audit trail of all changes, and providing a gamified leaderboard system to encourage user contributions.

---

## Setup and Development

### Development Commands

Use `npm` for package management.

-   **Install dependencies**:
    ```bash
    npm install
    ```
-   **Run the development server**:
    ```bash
    npm run dev
    ```
-   **Build the project for production**:
    ```bash
    npm run build
    ```
-   **Run the production server**:
    ```bash
    npm run start
    ```
-   **Lint the codebase**:
    ```bash
    npm run lint
    ```

### Database

The project uses Drizzle ORM with a Turso database.

-   **Apply schema changes to the database**:
    ```bash
    npx drizzle-kit push
    ```
-   **Generate database migration files**:
    ```bash
    npm run db:generate
    ```
-   **Populate the database with sample data**:
    ```bash
    npm run populate-resources-safe
    ```

---

## Key Technologies & Code Style

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with a dark/light theme.
-   **Authentication**: NextAuth.js with the Discord provider.
-   **Database**: Turso (SQLite) with Drizzle ORM.
-   **Linting**: ESLint with the `next/core-web-vitals` configuration. Adhere to the rules defined in `.eslintrc.json`.

---

## Code Style Guidelines

-   **Language**: All new code should be written in **TypeScript**.
-   **Indentation**: Use **2 spaces** for indentation, not tabs.
-   **Linting**: The project uses ESLint with the `next/core-web-vitals` configuration. Before committing any changes, run the linter to ensure your code adheres to the project's style:
    ```bash
    npm run lint
    ```
-   **React Components**: Use functional components with hooks.
-   **API Routes**: All API routes should include proper authentication and permission checks using helpers from `lib/auth.ts` and `lib/discord-roles.ts`.

---

## Bumping the Version Number

- The project includes a changelog system to update the version number and changelog under lib/changelog.json. Please add individual changes with their type (`feature`, `improvement`, `bugfix`, `breaking`).
- If unsure of appropriate version number for the incoming changes, prompt the user to ask for guidance.
- Also update the README.md with the release notes in the following format:
```
## 🚀 Release Notes - Version [VERSION_NUMBER]

**Release Date:** [YYYY-MM-DD]

---

### ✨ New Features

* [Brief description of a new feature, including what it does and why it's beneficial.]
* [Another new feature, if applicable.]

### 🚀 Improvements

* [Description of an enhancement to an existing feature.]
* [Details about performance improvements, UI/UX updates, or refactoring.]

### 🐛 Bug Fixes

* [A summary of a bug that was fixed and the impact on the user.]
* [Another bug fix, if applicable.]
---
```

## Agent Personas & Tools

The application has three primary user roles, or "agents," with different levels of access and capabilities. All role-based logic is handled server-side in `lib/discord-roles.ts` and enforced via middleware and in API routes.

### 1. Contributor Agent

**Purpose**: A standard user who can view and update resource quantities.

**Permissions**: `canAccessResources`

**Tools (API Endpoints & UI Components)**:
-   **View all resources**: `GET /api/resources`
-   **View a single resource's details and history**: `GET /api/resources/[id]` and `GET /api/resources/[id]/history`
-   **Update resource quantities (Add/Remove/Set)**: `PUT /api/resources/[id]`
    -   Associated UI: `app/components/UpdateQuantityModal.tsx`
-   **Transfer resources between locations**: `PUT /api/resources/[id]/transfer`
    -   Associated UI: `app/components/TransferModal.tsx`
-   **View personal activity log**: `GET /api/user/activity`
-   **View leaderboards**: `GET /api/leaderboard` and `GET /api/leaderboard/[userId]`

### 2. Logistics Manager Agent

**Purpose**: A trusted user who can manage resource targets in addition to standard contributor actions.

**Permissions**: `canAccessResources`, `canEditTargets`

**Tools**:
-   All tools available to the **Contributor Agent**.
-   **Update resource target quantities**: `PUT /api/resources/[id]/target`
    -   Associated UI: `app/components/ChangeTargetModal.tsx`

### 3. Administrator Agent

**Purpose**: A high-level user with full control over the system, including resource management, user data, and system configuration.

**Permissions**: `isAdmin`, `canAccessResources`, `canEditTargets`, `canManageUsers`, `canExportData`

**Tools**:
-   All tools available to the **Logistics Manager Agent**.
-   **Create new resources**: `POST /api/resources`
    -   Associated UI: The "Add New Resource" form in `app/components/ResourceTable.tsx`.
-   **Edit resource metadata (name, category, etc.)**: `PUT /api/resources` (with `resourceMetadata` in the body)
    -   Associated UI: `app/components/EditResourceModal.tsx`
-   **Delete resources and their history**: `DELETE /api/resources/[id]`
-   **Delete individual history entries**: `DELETE /api/resources/[id]/history/[entryId]`
-   **View all users**: `GET /api/users`
    -   Associated UI: `app/components/UserTable.tsx`
-   **Export data for any user**: `GET /api/users/[userId]/data-export`

---

## Security Considerations

-   **Authentication**: All sensitive API routes are protected by `getServerSession` from NextAuth.js. Middleware (`middleware.ts`) enforces authentication for all pages under `/dashboard`, `/resources`, and `/users`.
-   **Authorization**: Permissions are strictly role-based and controlled by the `DISCORD_ROLES_CONFIG` environment variable. Logic for checking permissions is centralized in `lib/discord-roles.ts` and should be used in all relevant API routes.
-   **Database**: All database queries are made through Drizzle ORM, which uses parameterized queries to prevent SQL injection.
-   **Input Validation**: API routes are responsible for validating incoming data (e.g., ensuring quantities are not negative).
-   **GDPR/Privacy**: The application provides endpoints for user data export (`/api/user/data-export`) and anonymization (`/api/user/data-deletion`). When modifying these, ensure user privacy is maintained.
