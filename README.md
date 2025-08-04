# Discord Resource Tracker

A comprehensive resource management and tracking portal with Discord authentication and role-based access control. Perfect for Discord communities that need to track and manage resources, inventory, or any quantifiable items.

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
- **Leaderboard System** - Track and reward user contributions

## GDPR & Privacy Features

- **Data Export** - Users can download all their data in JSON format
- **Data Deletion** - Request anonymization of personal data
- **Activity Transparency** - View complete history of actions taken
- **Privacy Controls** - Clear data retention policies and user rights

## Prerequisites

- Node.js 18.x or higher
- A Discord server where you have administrator access
- SQLite database (local or [Turso](https://turso.tech) for remote hosting)

## Setup

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/discord-resource-tracker.git
cd discord-resource-tracker
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env.local\` file with the following environment variables:
\`\`\`env
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Discord Server ID for role checking
DISCORD_GUILD_ID=your_discord_server_id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret # Generate with: openssl rand -base64 32

# Database Configuration
# Option 1: Turso (Remote SQLite)
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Option 2: Local SQLite (if Turso variables are not set)
SQLITE_DATABASE=path/to/your/database.db  # Optional, defaults to 'resource-tracker.db'

# Application Configuration
NEXT_PUBLIC_APP_NAME=Resource Tracker
NEXT_PUBLIC_ORGANIZATION_NAME=Your Organization
NEXT_PUBLIC_DISCORD_INVITE_URL=your_discord_invite_url

# Discord Role Configuration
# JSON array of role configurations
DISCORD_ROLES_CONFIG='[
  {
    "id": "your_role_id_1",
    "name": "Super Admin",
    "level": 100,
    "isAdmin": true,
    "canEditTargets": true,
    "canAccessResources": true
  },
  {
    "id": "your_role_id_2",
    "name": "Resource Manager",
    "level": 50,
    "isAdmin": true,
    "canEditTargets": true,
    "canAccessResources": true
  },
  {
    "id": "your_role_id_3",
    "name": "Senior Member",
    "level": 30,
    "canAccessResources": true
  },
  {
    "id": "your_role_id_4",
    "name": "Member",
    "level": 10,
    "canAccessResources": true
  }
]'
\`\`\`

4. Set up Discord OAuth Application:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to OAuth2 settings
   - Add redirect URI: \`http://localhost:3000/api/auth/callback/discord\`
   - Copy Client ID and Client Secret to your \`.env.local\`

5. Set up Turso Database:
   - Go to https://turso.tech
   - Create a new database
   - Copy the database URL and auth token to your \`.env.local\`
   - Run the database migrations:
     \`\`\`bash
     npm run db:push
     \`\`\`

6. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## Role System

The application uses a flexible role-based permission system that can be configured to match your Discord server's structure. Each role can be configured with the following properties:

- `id`: Discord role ID
- `name`: Display name for the role
- `level`: Numeric level for hierarchy (higher numbers = higher access)
- `isAdmin`: Whether the role has administrative privileges
- `canEditTargets`: Whether the role can edit resource targets
- `canAccessResources`: Whether the role can access the resource system

Example role hierarchy:

1. Super Admin (Level 100)
   - Full administrative access
   - Can edit/delete/create resources
   - Can edit target quantities
   - Can access all features

2. Resource Manager (Level 50)
   - Administrative access to resources
   - Can edit/delete/create resources
   - Can edit target quantities

3. Senior Member (Level 30)
   - Enhanced access privileges
   - Can view and update resources

4. Member (Level 10)
   - Basic access
   - Can view and update resources

This is just an example - you can configure any number of roles with custom permissions and levels to match your organization's needs. The system is flexible and allows you to:
- Create any number of roles
- Set custom permission levels
- Define granular access controls
- Map existing Discord roles to specific permissions

See the environment variables section for configuration details.

## Database Schema

The application uses SQLite with Drizzle ORM, supporting both local SQLite and Turso for remote hosting. The schema includes:

- Users
- User Sessions
- Resources
- Resource History
- Leaderboard

See \`lib/db.ts\` for the complete schema definition.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Discord provider
- **Database**: SQLite with Drizzle ORM (supports local SQLite or Turso)
- **Deployment**: Vercel-ready
- **Privacy**: GDPR-compliant data handling

## Support

If you encounter any issues or have questions, please file an issue on GitHub.