# 🎨 Customization Guide

This guide shows you how to customize Resource Tracker for your specific organization, game, or use case.

## Branding & Appearance

### Organization Name

Set your organization name throughout the app:

```bash
NEXT_PUBLIC_ORG_NAME=Your Community Name
```

This appears in:

- Page titles
- Navigation header
- Privacy policy text
- Leaderboard descriptions

### Styling & Themes

The app uses Tailwind CSS with built-in dark/light theme support.

**Customize colors in `tailwind.config.js`:**

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add your brand colors
        brand: {
          50: "#f0f9ff",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
      },
    },
  },
};
```

**Common customizations:**

- Primary accent color
- Background gradients
- Button styles
- Card appearances

### Logo & Icons

1. Add your logo to `public/` directory
2. Update `app/layout.tsx` to include favicon
3. Customize the navigation header in `app/components/ClientNavigation.tsx`

## Resource Types

### Categories

Modify resource categories in the population scripts:

```typescript
const categories = [
  "Raw Materials",
  "Processed Goods",
  "Equipment",
  "Consumables",
  "Currency",
];
```

### Resource Examples

The population scripts include example resources. Customize them for your use case:

**Gaming Community:**

- Weapons, Armor, Potions
- Crafting Materials
- Currency, Reputation Points

**Business/Organization:**

- Office Supplies
- Equipment
- Budget Categories
- Project Resources

**Educational Institution:**

- Textbooks, Lab Equipment
- Classroom Resources
- Technology Devices

### Icons & Images

Resources support both Discord emoji icons and image URLs:

```typescript
{
  name: 'Steel Ingot',
  icon: ':metal:', // Discord emoji
  imageUrl: 'https://example.com/steel.png' // External image
}
```

## Discord Integration

### Role Configuration

Customize roles for your Discord server by mapping Discord Role IDs to the application's permission levels. The configuration is set in the `DISCORD_ROLES_CONFIG` environment variable.

The following example reflects the three primary agent personas used in this application:

```json
[
  {
    "id": "your_admin_discord_role_id",
    "name": "Administrator",
    "level": 100,
    "isAdmin": true,
    "canManageUsers": true,
    "canEditTargets": true,
    "canAccessResources": true,
    "canExportData": true
  },
  {
    "id": "your_logistics_manager_discord_role_id",
    "name": "Logistics Manager",
    "level": 50,
    "isAdmin": false,
    "canManageUsers": false,
    "canEditTargets": true,
    "canAccessResources": true,
    "canExportData": false
  },
  {
    "id": "your_contributor_discord_role_id",
    "name": "Contributor",
    "level": 1,
    "isAdmin": false,
    "canManageUsers": false,
    "canEditTargets": false,
    "canAccessResources": true,
    "canExportData": false
  }
]
```

### Permission Levels

- **`isAdmin`**: Grants full administrative access, including creating, editing, and deleting resources and history entries.
- **`canManageUsers`**: Allows access to the user management page to view registered users.
- **`canEditTargets`**: Permits the modification of resource target quantities.
- **`canAccessResources`**: The base permission required to view and update resource quantities.
- **`canExportData`**: Allows the user to export data for any user (Administrator-only).
- **`level`**: A numeric value that determines the role's hierarchy for display purposes. Higher numbers have higher precedence.

## Points & Leaderboard

### Points Calculation

Modify the points system in `lib/leaderboard.ts`:

```typescript
export function calculatePoints(
  actionType: "ADD" | "SET" | "REMOVE",
  quantityChanged: number,
  resourceMultiplier: number,
  resourceStatus: string,
  resourceCategory: string,
): PointsCalculation {
  // Customize base points per action
  const baseMultipliers = {
    ADD: 1.0,
    SET: 0.5, // Less points for setting
    REMOVE: 0.0, // No points for removing
  };

  // Customize status bonuses
  const statusBonuses = {
    critical: 0.2, // 20% bonus for critical resources
    below_target: 0.1, // 10% bonus
    at_target: 0.0, // No bonus
  };

  // Add category multipliers
  const categoryMultipliers = {
    "Raw Materials": 1.0,
    "Rare Materials": 2.0,
    Equipment: 1.5,
  };
}
```

### Leaderboard Display

Customize what's shown on the leaderboard:

- Time periods (daily, weekly, monthly, all-time)
- Point categories
- Achievement badges
- User statistics

## Database Customization

### Additional Fields

Add custom fields to resources:

```typescript
// In lib/db.ts
export const resources = sqliteTable("resources", {
  // Existing fields...
  rarity: text("rarity"), // Common, Rare, Epic, Legendary
  location: text("location"), // Where it's found/stored
  craftingTime: integer("crafting_time"), // Minutes to craft
  prerequisites: text("prerequisites"), // JSON array of required items
});
```

### Custom Tables

Add completely new tables for your use case:

```typescript
export const guilds = sqliteTable("guilds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: text("leader_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

## API Customization

### Custom Endpoints

Add organization-specific API endpoints:

```typescript
// app/api/custom/inventory/route.ts
export async function GET(request: NextRequest) {
  // Custom inventory logic
}

// app/api/custom/crafting/route.ts
export async function POST(request: NextRequest) {
  // Custom crafting system
}
```

### Webhooks

Add webhook support for external integrations:

```typescript
// Send updates to Discord, Slack, etc.
export async function sendWebhook(event: string, data: any) {
  await fetch(process.env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, data }),
  });
}
```

## UI/UX Customization

### Page Layouts

Customize page layouts in the `app/` directory:

- Dashboard widgets
- Resource grid vs table views
- Navigation structure
- Mobile responsiveness

### Components

Create custom components:

```typescript
// app/components/CustomResourceCard.tsx
export function CustomResourceCard({ resource }) {
  return (
    <div className="custom-card">
      {/* Your custom design */}
    </div>
  )
}
```

### Animations

Add animations with Tailwind or Framer Motion:

- Page transitions
- Loading states
- Success/error feedback
- Hover effects

## Advanced Customizations

### Multi-tenant Support

Support multiple organizations:

```typescript
// Add organization context
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").unique(),
  settings: text("settings"), // JSON configuration
});
```

### Plugin System

Create a plugin architecture:

```typescript
// lib/plugins.ts
export interface Plugin {
  name: string;
  version: string;
  init: () => void;
  hooks: {
    beforeResourceUpdate?: (resource: Resource) => Resource;
    afterResourceUpdate?: (resource: Resource) => void;
  };
}
```

### Custom Metrics

Add business-specific metrics:

- Resource turnover rates
- User engagement scores
- Efficiency measurements
- Predictive analytics

## Configuration Examples

### Gaming Community

```bash
NEXT_PUBLIC_ORG_NAME=Mythic Raiders Guild
DISCORD_ROLES_CONFIG=[
  {"id":"guild_master","name":"Guild Master","level":100,"isAdmin":true},
  {"id":"officer","name":"Officer","level":50,"canEditTargets":true},
  {"id":"member","name":"Member","level":1,"canAccessResources":true}
]
```

### Business Organization

```bash
NEXT_PUBLIC_ORG_NAME=Acme Corp Inventory
DISCORD_ROLES_CONFIG=[
  {"id":"manager","name":"Manager","level":100,"isAdmin":true},
  {"id":"supervisor","name":"Supervisor","level":50,"canEditTargets":true},
  {"id":"employee","name":"Employee","level":1,"canAccessResources":true}
]
```

### Educational Institution

```bash
NEXT_PUBLIC_ORG_NAME=University Lab Resources
DISCORD_ROLES_CONFIG=[
  {"id":"professor","name":"Professor","level":100,"isAdmin":true},
  {"id":"ta","name":"Teaching Assistant","level":50,"canEditTargets":true},
  {"id":"student","name":"Student","level":1,"canAccessResources":true}
]
```

## Migration Guide

When customizing an existing installation:

1. **Backup your data** before making changes
2. **Test in development** environment first
3. **Update environment variables** gradually
4. **Document your changes** for team members
5. **Consider version control** for custom modifications

## Getting Help

- Check the [Development Guide](./development-guide.md) for technical details
- Review [ENVIRONMENT.md](../ENVIRONMENT.md) for configuration options
- Join our community discussions for customization ideas
- Submit feature requests for commonly needed customizations
