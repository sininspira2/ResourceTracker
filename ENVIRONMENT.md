# Environment Variables Configuration

This document describes all environment variables that can be configured to customize the Resource Tracker application.

## Required Variables

### Discord Authentication
- `DISCORD_CLIENT_ID` - Your Discord application's client ID
- `DISCORD_CLIENT_SECRET` - Your Discord application's client secret  
- `DISCORD_GUILD_ID` - The Discord server ID for role checking

### NextAuth Configuration
- `NEXTAUTH_URL` - The base URL of your application (e.g., `https://yourdomain.com`)
- `NEXTAUTH_SECRET` - A secret key for JWT encryption (generate a random string)

### Database Configuration
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso authentication token

### Role Configuration
- `DISCORD_ROLES_CONFIG` - JSON array of Discord role configurations (see Role Configuration section)

## Optional Variables

### Organization Branding
- `NEXT_PUBLIC_ORG_NAME` - Your organization/community name (default: "community")
- `NEXT_PUBLIC_ORG_DESCRIPTION` - Your organization description

## Role Configuration

The `DISCORD_ROLES_CONFIG` environment variable should contain a JSON array of role objects with the following structure:

```json
[
  {
    "id": "discord_role_id_1",
    "name": "Admin",
    "level": 100,
    "isAdmin": true,
    "canEditTargets": true,
    "canAccessResources": true
  },
  {
    "id": "discord_role_id_2", 
    "name": "Member",
    "level": 1,
    "isAdmin": false,
    "canEditTargets": false,
    "canAccessResources": true
  }
]
```

### Role Properties
- `id` (string): Discord role ID
- `name` (string): Human-readable role name
- `level` (number): Role hierarchy level (higher = more permissions)
- `isAdmin` (boolean): Can create/edit/delete resources
- `canEditTargets` (boolean): Can modify resource target quantities
- `canAccessResources` (boolean): Can access the resource management system

## Example .env.local

```bash
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_GUILD_ID=your_discord_server_id

# Discord Roles Configuration
DISCORD_ROLES_CONFIG=[{"id":"123456789","name":"Admin","level":100,"isAdmin":true,"canEditTargets":true,"canAccessResources":true},{"id":"987654321","name":"Member","level":1,"isAdmin":false,"canEditTargets":false,"canAccessResources":true}]

# Organization Branding
NEXT_PUBLIC_ORG_NAME=My Gaming Community
NEXT_PUBLIC_ORG_DESCRIPTION=A resource management portal for our community

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_very_long_random_secret_key_here

# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

## Getting Discord Role IDs

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on a role in your server settings
3. Click "Copy ID"
4. Use this ID in your role configuration

## Security Notes

- Keep all secrets secure and never commit them to version control
- Use strong, unique values for `NEXTAUTH_SECRET`
- Regularly rotate your Discord client secret and database tokens
- Consider using a secret management service for production deployments