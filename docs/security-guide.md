# 🔒 Security Guide

This guide covers security best practices and considerations for Resource Tracker deployments.

## Authentication & Authorization

### Discord OAuth Security
-   **Secure Redirect URIs**: Only add trusted domains to your Discord application's OAuth2 settings.
-   **Environment Variables**: Never commit Discord secrets (`DISCORD_CLIENT_SECRET`) to version control.
-   **Token Management**: Access tokens are handled server-side and automatically refreshed by NextAuth.js.
-   **Session Security**: Sessions use secure, HTTP-only cookies with a defined expiration.

### Role-Based Access Control (RBAC)
Resource Tracker implements a granular, role-based permission system configured via the `DISCORD_ROLES_CONFIG` environment variable.

**Available Permissions:**
-   `canAccessResources`: The base permission to view and update resource quantities.
-   `canEditTargets`: Allows a user to modify resource target quantities.
-   `canManageUsers`: Grants access to the user management page.
-   `canExportData`: Allows exporting data for any user (intended for administrators).
-   `isAdmin`: Grants full administrative privileges, including creating/editing/deleting resources and their history.

**Security by Design:**
-   **Default Deny**: Users have no access unless they are granted a role defined in the configuration.
-   **Least Privilege**: The system is designed to allow for roles with the minimum required permissions for their function.
-   **Audit Trail**: All significant actions are logged in the `resource_history` table with user attribution.

## Environment Security

### Production Environment Variables
All sensitive configuration is handled via environment variables. Never hard-code secrets in the source code.

```bash
# Use a strong, unique secret of at least 32 characters
NEXTAUTH_SECRET=your_very_long_random_secret_for_production

# Use secure database credentials from your provider (e.g., Turso)
TURSO_DATABASE_URL=libsql://your-prod-db-name.turso.io
TURSO_AUTH_TOKEN=your_secure_production_auth_token

# Your production Discord App credentials
DISCORD_CLIENT_ID=your_production_discord_client_id
DISCORD_CLIENT_SECRET=your_production_discord_client_secret

# A validated JSON array for role configuration
DISCORD_ROLES_CONFIG=[{"id":"your_admin_role_id","name":"Administrator","level":100,"isAdmin":true,...}]
```

### Secret Management
-   **Vercel Deployment**: Use the Vercel dashboard to set environment variables for Production, Preview, and Development environments.
-   **Rotation**: Rotate secrets (like `NEXTAUTH_SECRET` and `TURSO_AUTH_TOKEN`) periodically, especially if a leak is suspected.
-   **Logging**: Ensure that secrets are never logged or exposed in error messages.

## Database Security

### Turso Security Features
-   **Encryption**: Data is encrypted at rest and in transit (HTTPS/TLS).
-   **Access Control**: The database is protected by a long-lived auth token.
-   **SQL Injection Prevention**: The application uses Drizzle ORM, which provides built-in protection through parameterized queries. All user input is automatically escaped.

### Data Validation
All API endpoints validate and sanitize incoming data before it reaches the database. For example, quantities are checked to be valid numbers.

## GDPR & Privacy Compliance

### Data Collection
The application collects the minimum data necessary for its operation:
-   **Discord Profile**: `discordId`, `username`, and `avatar`.
-   **Activity Data**: A log of resource updates attributed to the user.

### User Rights
The API provides endpoints to comply with user rights under GDPR:
-   **Right to Access/Portability**: The `/api/user/data-export` endpoint provides a JSON export of all data associated with the user.
-   **Right to Erasure**: The `/api/user/data-deletion` endpoint anonymizes a user's data, severing the link between their Discord identity and their past contributions.

## API Security

### Rate Limiting
Rate limiting is not implemented by default but is highly recommended for production deployments to prevent abuse. This can be added at the middleware or server level.

### Input Validation
-   All API routes use TypeScript for strict type checking of request and response bodies.
-   Server-side validation ensures that users cannot submit malformed or malicious data.
-   Authentication and authorization are checked on all protected routes before any logic is executed.

## Vulnerability Management

### Dependency Updates
Regularly update dependencies to patch known vulnerabilities.
```bash
# Check for vulnerabilities in dependencies
npm audit

# Attempt to automatically fix them
npm audit fix
```

### Responsible Disclosure
If you discover a security vulnerability, please report it privately to the project maintainers. Do not disclose it publicly until a fix has been made available.

## Security Checklist

### Pre-Deployment
-   [ ] All secrets are stored as environment variables, not in code.
-   [ ] Production environment variables are set with strong, unique values.
-   [ ] The `DISCORD_ROLES_CONFIG` is correctly formatted and uses production Role IDs.
-   [ ] The Discord App's Redirect URI is correctly set to the production URL.
-   [ ] Debugging flags are turned off in the production environment.

### Ongoing Maintenance
-   [ ] Regularly rotate secrets and API keys.
-   [ ] Periodically run `npm audit` to check for new vulnerabilities in dependencies.
-   [ ] Monitor logs for suspicious activity, such as repeated failed login attempts or unusual API traffic.