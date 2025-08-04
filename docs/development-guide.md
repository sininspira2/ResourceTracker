# 🛠️ Development Guide

This guide covers everything you need to know for developing and contributing to Resource Tracker.

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Discord Developer Account** for OAuth testing
- **Turso Account** for database (free tier available)

## Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/your-username/ResourceTracker.git
cd ResourceTracker
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and fill in the required values:

```bash
# Required for development
DISCORD_CLIENT_ID=your_test_app_client_id
DISCORD_CLIENT_SECRET=your_test_app_secret
DISCORD_GUILD_ID=your_test_server_id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_local_secret
TURSO_DATABASE_URL=your_dev_database_url
TURSO_AUTH_TOKEN=your_dev_auth_token

# Discord roles configuration (JSON)
DISCORD_ROLES_CONFIG=[{"id":"role_id","name":"Admin","level":100,"isAdmin":true,"canAccessResources":true}]

# Optional branding
NEXT_PUBLIC_ORG_NAME=Dev Test Community
```

### 3. Database Setup
```bash
# Apply database schema
npm run db:push

# Populate with sample data
npm run populate-resources-safe
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

## Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js with Discord OAuth
- **Database**: Turso (SQLite) with Drizzle ORM
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes and test locally
npm run dev

# Run linting
npm run lint

# Test build
npm run build
```

### 2. Database Changes
```bash
# Modify schema in lib/db.ts
# Generate migration
npm run db:generate

# Apply to local database
npm run db:push
```

### 3. Testing
```bash
# Test authentication flow
# - Sign in with Discord
# - Verify role-based access
# - Test CRUD operations

# Test responsive design
# - Mobile, tablet, desktop
# - Light and dark themes

# Test error cases
# - Invalid permissions
# - Network failures
# - Malformed data
```

## Common Development Tasks

### Adding New Resource Types
1. Update database schema in `lib/db.ts`
2. Generate and apply migration
3. Update population scripts with examples
4. Add UI components if needed

### Adding New API Endpoints
1. Create route file in `app/api/`
2. Implement proper authentication
3. Add input validation
4. Document in `api-reference.md`

### Modifying User Permissions
1. Update role types in `lib/discord-roles.ts`
2. Modify permission checking functions
3. Update environment documentation
4. Test with different role configurations

### Styling Changes
1. Use Tailwind CSS classes
2. Support both light and dark themes
3. Ensure responsive design
4. Test accessibility

## Environment Variables

See [ENVIRONMENT.md](../ENVIRONMENT.md) for complete documentation.

**Development-specific variables:**
```bash
# Enable debug logging
NODE_ENV=development

# NextAuth debug (optional)
NEXTAUTH_DEBUG=true

# Database debugging (optional)
DATABASE_DEBUG=true
```

## Debugging

### Authentication Issues
1. Check Discord app configuration
2. Verify redirect URIs match exactly
3. Ensure all environment variables are set
4. Check browser console for errors

### Database Issues
1. Verify Turso credentials
2. Check database permissions
3. Look for migration errors
4. Use Turso CLI for direct access

### Role Permission Issues
1. Validate `DISCORD_ROLES_CONFIG` JSON
2. Check user's actual Discord roles
3. Verify role IDs are correct
4. Test with `npm run validate-roles`

## Code Style

### TypeScript
- Use strict type checking
- Prefer interfaces over types
- Document complex functions
- Handle errors explicitly

### React Components
- Use functional components
- Implement proper loading states
- Handle error boundaries
- Support server-side rendering

### API Routes
- Validate all inputs
- Use consistent error responses
- Implement proper HTTP status codes
- Add request logging

## Performance Considerations

### Database
- Use appropriate indexes
- Implement pagination for large datasets
- Cache expensive queries
- Monitor query performance

### Frontend
- Implement loading states
- Use React Suspense appropriately
- Optimize images and assets
- Monitor bundle size

### API
- Implement rate limiting
- Use compression
- Cache static responses
- Monitor response times

## Security Best Practices

### Authentication
- Validate all sessions
- Implement proper CSRF protection
- Use secure cookie settings
- Validate Discord tokens

### Authorization
- Check permissions on every request
- Use least-privilege principle
- Validate role configurations
- Audit permission changes

### Data Protection
- Sanitize all inputs
- Implement GDPR compliance
- Protect sensitive data
- Use HTTPS in production

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

### Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request
5. Address review feedback

### Code Review Checklist
- [ ] Functionality works as expected
- [ ] Code follows style guidelines
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No console errors

## Deployment

### Local Testing
```bash
# Test production build
npm run build
npm start
```

### Vercel Deployment
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push
4. Monitor for errors

See the main README for detailed deployment instructions.