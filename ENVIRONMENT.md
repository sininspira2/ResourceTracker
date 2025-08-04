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

The `DISCORD_ROLES_CONFIG` environment variable should contain a JSON array of role objects. **This is the most complex environment variable to configure correctly.**

#### JSON Structure:
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

#### Setting in Different Environments:

**Local Development (.env.local):**
```bash
DISCORD_ROLES_CONFIG=[{"id":"123456789","name":"Admin","level":100,"isAdmin":true,"canEditTargets":true,"canAccessResources":true},{"id":"987654321","name":"Member","level":1,"isAdmin":false,"canEditTargets":false,"canAccessResources":true}]
```

**Vercel Dashboard:**
When setting this in Vercel's environment variables UI, use the **single-line minified format**:
```
[{"id":"123456789","name":"Admin","level":100,"isAdmin":true,"canEditTargets":true,"canAccessResources":true},{"id":"987654321","name":"Member","level":1,"isAdmin":false,"canEditTargets":false,"canAccessResources":true}]
```

**⚠️ Important for Vercel:**
- **No spaces or newlines** in the JSON
- **No extra quotes** around the entire value
- Use the Vercel CLI for complex values: `vercel env add DISCORD_ROLES_CONFIG`
- Test locally first to ensure your JSON is valid

#### Quick Validation:
Test your JSON before deploying:
```bash
# Test if your JSON is valid
node -e "console.log(JSON.parse('YOUR_JSON_HERE'))"
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

## Troubleshooting

### OAuth Callback Error: "State cookie was missing"

This is a common NextAuth.js error. Try these solutions:

#### 1. Check NEXTAUTH_URL
```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://yourdomain.com
```

**Important**: 
- Do NOT end with a slash (`/`)
- Must match exactly where your app is running
- Must match the callback URL in Discord

#### 2. Discord App Configuration
In your Discord Developer Portal:
- **Redirect URI**: `http://localhost:3000/api/auth/callback/discord` (dev)
- **Redirect URI**: `https://yourdomain.com/api/auth/callback/discord` (prod)

#### 3. NEXTAUTH_SECRET
Generate a strong secret:
```bash
# Generate a random secret
openssl rand -base64 32
```

#### 4. Clear Browser Data
- Clear cookies for your domain
- Try incognito/private browsing
- Disable browser extensions that might block cookies

#### 5. Check Environment Variables
Ensure all required variables are loaded:
```bash
# In your .env.local file (no spaces around =)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### Other Common Issues

#### "CSRF token mismatch"
- Usually fixed by clearing cookies
- Ensure NEXTAUTH_SECRET is set

#### "OAuth app not found"
- Check DISCORD_CLIENT_ID is correct
- Verify Discord app is not deleted

#### "Invalid redirect URI"
- Discord callback URL must exactly match NEXTAUTH_URL + `/api/auth/callback/discord`
- No trailing slashes allowed

#### "Failed to parse DISCORD_ROLES_CONFIG" JSON Error
This error occurs when the JSON in `DISCORD_ROLES_CONFIG` is malformed:

**Common Causes:**
- Extra quotes around the JSON value
- Newlines or spaces in the JSON when set in Vercel UI
- Missing commas or brackets
- Unescaped quotes in role names

**Solutions:**
1. **Validate JSON locally first:**
   ```bash
   node -e "console.log(JSON.parse('[{\"id\":\"123\",\"name\":\"Test\",\"level\":1,\"canAccessResources\":true}]'))"
   ```

2. **Use minified JSON (no spaces/newlines):**
   ```
   [{"id":"123456789","name":"Admin","level":100,"isAdmin":true,"canAccessResources":true}]
   ```

3. **Use Vercel CLI for complex values:**
   ```bash
   vercel env add DISCORD_ROLES_CONFIG
   # Then paste your JSON when prompted
   ```

4. **Check logs:** The enhanced error messages will show the exact issue with your JSON

**Temporary workaround:** The app will work without `DISCORD_ROLES_CONFIG` due to the built-in bypass, but you won't have proper role-based permissions.