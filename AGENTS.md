# AGENTS.md

This document provides context and instructions for AI coding agents to effectively understand and contribute to this project. For a human-oriented guide, please see `README.md` or the documentation in the `/docs` directory.

## Project Overview

This is a full-stack web application for resource management and tracking. It is built with Next.js (App Router), TypeScript, and Tailwind CSS. The backend uses Next.js API Routes, Drizzle ORM, and a Turso (SQLite) database. Authentication is handled by NextAuth.js with a Discord provider, which also drives role-based access control (RBAC).

The application's primary function is to track resource quantities across two locations, maintain a complete history of changes, and provide a gamified leaderboard to encourage user participation.

---

## Development

Use `npm` for all package management and script execution.

### Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-name>
npm install
```

### Key Commands

- **Run the development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Run the production server**: `npm run start`
- **Lint the codebase**: `npm run lint`

---

## Testing

The project uses Jest for unit and integration testing. All test files are located in the `tests/` directory at the root of the project.

- **Run all tests**:
  ```bash
  npm test
  ```
- **Test Environment**: Most server-side tests require a `node` environment. Use the `@jest-environment node` docblock at the top of test files that interact with Node.js APIs (e.g., `fetch`, `Request`).
- **Mocks**: Mocks for external dependencies are located in the `__mocks__` directory. When testing modules that rely on `next/cache`, be sure to mock it to avoid `Invariant: incrementalCache missing` errors.

---

## Database

The database is managed using Drizzle ORM with a Turso (SQLite) database. Migrations are handled by `drizzle-kit`.

- **Generate a new migration**: `npm run db:generate`
- **Apply migrations**: `npm run db:migrate`
- **Check migration status**: `npm run db:check`

A custom script (`scripts/generate-migration-hashes.ts`) generates hashes of migration files to ensure the database schema is in sync with the codebase. This script is automatically run as part of the `npm run build` and `npm run db:generate` commands.

---

## Project Conventions

### Code Style

- **Language**: TypeScript
- **Formatting**: Use Prettier for code formatting. A `.prettierrc` file is provided.
- **Linting**: Use ESLint. Run `npm run lint` before committing to check for issues.

### Versioning

- The project version is managed in `package.json`.
- A changelog is maintained in `lib/changelog.json`. Please add an entry for any significant change, specifying the type (`feature`, `improvement`, `bugfix`, `breaking`).
- The `npm run update-version` script can be used to bump the version number and update the changelog.

### Security

- **Authentication**: API routes are protected using `getServerSession` from NextAuth.js. Middleware (`middleware.ts`) protects all pages under `/dashboard`, `/resources`, and `/users`.
- **Authorization**: Role-based permissions are defined in `lib/discord-roles.ts` and controlled by the `DISCORD_ROLES_CONFIG` environment variable. Enforce these permissions in all relevant API routes.
- **Input Validation**: All API routes must validate incoming data to prevent errors and security vulnerabilities.

---

## Agent Personas & Tools

The application defines three user roles with specific permissions and access to different tools (API endpoints and UI components).

### 1. Contributor

- **Permissions**: `canAccessResources`
- **Tools**:
  - View resources: `GET /api/resources`
  - Update resource quantities: `PUT /api/resources/[id]`
  - Transfer resources: `PUT /api/resources/[id]/transfer`
  - View leaderboards: `GET /api/leaderboard`

### 2. Logistics Manager

- **Permissions**: `canAccessResources`, `canEditTargets`
- **Tools**:
  - All Contributor tools.
  - Update resource targets: `PUT /api/resources/[id]/target`

### 3. Administrator

- **Permissions**: `isAdmin`, `canAccessResources`, `canEditTargets`, `canManageUsers`, `canExportData`
- **Tools**:
  - All Logistics Manager tools.
  - Create, edit, and delete resources: `POST /api/resources`, `PUT /api/resources`, `DELETE /api/resources/[id]`
  - Manage users: `GET /api/users`
  - Export user data: `GET /api/users/[userId]/data-export`
