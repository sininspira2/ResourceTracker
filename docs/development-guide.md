# 🛠️ Development Guide

This guide covers everything you need to know for developing and contributing to Resource Tracker.

## Prerequisites

- **Node.js** 22+ and npm
- **Git** for version control
- **Discord Developer Account** for OAuth testing
- **Turso Account** for database (free tier available)

## Development Setup

### 1. Fork, Clone, and Install

To contribute to the project, you should first create your own copy (a "fork") of the repository on GitHub.

1.  **Fork the Repository**: Click the **Fork** button at the top-right of the main project's GitHub page. This will create a copy of the repository under your own GitHub account.

2.  **Clone Your Fork**: Clone the repository from your account to your local machine. Replace `YOUR_USERNAME` with your GitHub username.

    ```bash
    git clone https://github.com/YOUR_USERNAME/ResourceTracker.git
    cd ResourceTracker
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in the required values. See `ENVIRONMENT.md` for detailed instructions.

```bash
# Required for development
DISCORD_CLIENT_ID=your_test_app_client_id
DISCORD_CLIENT_SECRET=your_test_app_secret
DISCORD_GUILD_ID=your_test_server_id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_random_string_for_session_encryption
TURSO_DATABASE_URL=your_dev_database_url
TURSO_AUTH_TOKEN=your_dev_auth_token

# A comprehensive role configuration example
DISCORD_ROLES_CONFIG=[{"id":"your_admin_role_id","name":"Administrator","level":100,"isAdmin":true,"canManageUsers":true,"canEditTargets":true,"canAccessResources":true,"canExportData":true},{"id":"your_logistics_manager_role_id","name":"Logistics Manager","level":50,"isAdmin":false,"canManageUsers":false,"canEditTargets":true,"canAccessResources":true,"canExportData":false},{"id":"your_contributor_role_id","name":"Contributor","level":1,"isAdmin":false,"canManageUsers":false,"canEditTargets":false,"canAccessResources":true,"canExportData":false}]

# Optional branding
NEXT_PUBLIC_ORG_NAME=Dev Test Community
```

### 3. Database Setup

```bash
# Apply the latest database schema
npm run db:push

# Populate the database with sample data
npm run populate-resources
```

### 4. Start Development

```bash
npm run dev
# App will be available at http://localhost:3000
```

## Project Structure

```
ResourceTracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── dashboard/         # Dashboard pages
│   └── resources/         # Resource management pages
├── lib/                   # Shared utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database schema
│   └── discord-roles.ts  # Role management
├── scripts/              # Database and utility scripts
├── docs/                 # Documentation
└── drizzle/             # Database migrations
```

## Development Workflow

### 1. Feature Development

- Create a feature branch: `git checkout -b feature/new-feature-name`
- Make changes and test locally with `npm run dev`.
- Ensure code quality by running `npm run lint`.
- Verify the production build with `npm run build`.

### 2. Database Changes

- Modify the schema in `lib/db.ts`.
- Generate a migration file: `npm run db:generate`.
- Apply the migration to your local database: `npm run db:push`.

### 3. Testing

- **Authentication**: Test the full sign-in flow with different Discord roles.
- **Permissions**: Verify that role-based access control is enforced correctly on API routes and UI components.
- **Responsiveness**: Check the UI on mobile, tablet, and desktop viewports, in both light and dark themes.
- **Error Handling**: Test edge cases like invalid inputs, network failures, and insufficient permissions.

## Debugging

### Authentication Issues

1.  Double-check your Discord application configuration in the developer portal.
2.  Verify that the redirect URI in your Discord app settings matches `NEXTAUTH_URL` exactly.
3.  Ensure all required environment variables in `.env.local` are correctly set.
4.  Use your browser's developer tools to check for console errors or failed network requests.

### Database Issues

1.  Verify your Turso database URL and auth token are correct.
2.  Check for errors in the terminal during schema migration (`db:push`).
3.  Use the Turso CLI (`turso db shell <db_name>`) for direct database access to inspect data.

### Role Permission Issues

1.  Validate that `DISCORD_ROLES_CONFIG` is a valid, single-line JSON string.
2.  Ensure the role IDs in your configuration match the actual role IDs from your Discord server.
3.  Check that the test user has the intended roles assigned in Discord.

## Code Style

- **TypeScript**: Adhere to strict type checking. Document complex functions and types.
- **React**: Use functional components with hooks. Implement clear loading and error states.
- **API Routes**: Validate all incoming data. Use consistent error responses and appropriate HTTP status codes.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.

### Pull Request Process

1.  Create a feature branch from an up-to-date `main`.
2.  Develop the feature and include tests where applicable.
3.  Update all relevant documentation (`/docs`, `README.md`).
4.  Submit a pull request and describe your changes clearly.
5.  Address any feedback from the code review.

## Deployment

The application is designed for easy deployment on Vercel.

1.  Connect your GitHub repository to a new Vercel project.
2.  Configure the same environment variables you used for development, but with production values.
3.  Vercel will automatically build and deploy the application on every push to the `main` branch.

See the root `README.md` for a more detailed deployment guide.
