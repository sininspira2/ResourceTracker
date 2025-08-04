# Silver Portal

A comprehensive resource management and tracking portal with Discord authentication and role-based access control.

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

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with the following environment variables:
```
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Discord Server ID for role checking
DISCORD_GUILD_ID=your_discord_server_id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Turso Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
```

3. Set up Discord OAuth Application:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to OAuth2 settings
   - Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
   - Copy Client ID and Client Secret to your `.env.local`

4. Set up Turso Database:
   - Go to https://turso.tech
   - Create a new database
   - Copy the database URL and auth token to your `.env.local`

5. Run the development server:
```bash
npm run dev
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Discord provider
- **Database**: Turso (SQLite), Drizzle ORM
- **Deployment**: Vercel-ready
- **Privacy**: GDPR-compliant data handling 