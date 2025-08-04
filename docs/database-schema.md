# 🗄️ Database Schema

This document describes the database schema used by Resource Tracker, built with Drizzle ORM and SQLite (Turso).

## Overview

The application uses 5 main tables:
- `users` - Discord user information
- `user_sessions` - Session data for role caching
- `resources` - Resource definitions and current quantities
- `resource_history` - Audit trail of all resource changes
- `leaderboard` - Points and contribution tracking

## Table Definitions

### users
Stores Discord user information.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  custom_nickname TEXT,
  created_at INTEGER NOT NULL, -- Unix timestamp
  last_login INTEGER NOT NULL  -- Unix timestamp
);
```

**Fields:**
- `id` - Internal user ID (nanoid)
- `discord_id` - Discord user ID
- `username` - Discord username
- `avatar` - Discord avatar URL
- `custom_nickname` - User-set custom nickname
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

### user_sessions
Caches Discord role and guild membership data.

```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  roles TEXT NOT NULL, -- JSON array of role IDs
  is_in_guild INTEGER NOT NULL, -- Boolean (0/1)
  created_at INTEGER NOT NULL
);
```

**Fields:**
- `id` - Session ID (nanoid)
- `user_id` - Reference to users table
- `roles` - JSON string array of Discord role IDs
- `is_in_guild` - Whether user is in the Discord server
- `created_at` - Session creation timestamp

### resources
Main resource definitions and current state.

```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  icon TEXT, -- Discord emoji like ':ResourceIcon:'
  image_url TEXT, -- URL to resource image
  status TEXT, -- 'at_target', 'below_target', 'critical'
  target_quantity INTEGER, -- Target/threshold quantity
  multiplier REAL NOT NULL DEFAULT 1.0, -- Points multiplier
  last_updated_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Fields:**
- `id` - Resource ID (nanoid)
- `name` - Resource display name
- `quantity` - Current quantity
- `description` - Resource description
- `category` - Resource category (Raw Materials, Refined, etc.)
- `icon` - Discord emoji identifier
- `image_url` - URL to resource image
- `status` - Calculated status based on target
- `target_quantity` - Target quantity for status calculation
- `multiplier` - Points multiplier for leaderboard
- `last_updated_by` - Who last updated this resource
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### resource_history
Audit trail of all resource quantity changes.

```sql
CREATE TABLE resource_history (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  change_amount INTEGER NOT NULL, -- +/- amount
  change_type TEXT NOT NULL, -- 'absolute' or 'relative'
  updated_by TEXT NOT NULL,
  reason TEXT, -- Optional reason for change
  created_at INTEGER NOT NULL
);
```

**Fields:**
- `id` - History entry ID (nanoid)
- `resource_id` - Reference to resources table
- `previous_quantity` - Quantity before change
- `new_quantity` - Quantity after change
- `change_amount` - Net change (+/-)
- `change_type` - "absolute" (set to value) or "relative" (add/subtract)
- `updated_by` - User who made the change
- `reason` - Optional reason for the change
- `created_at` - Change timestamp

### leaderboard
Points and contribution tracking for gamification.

```sql
CREATE TABLE leaderboard (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  action_type TEXT NOT NULL, -- 'ADD', 'SET', 'REMOVE'
  quantity_changed INTEGER NOT NULL,
  base_points REAL NOT NULL, -- Points before multipliers
  resource_multiplier REAL NOT NULL,
  status_bonus REAL NOT NULL, -- Percentage bonus (0.0, 0.05, 0.10)
  final_points REAL NOT NULL, -- Final calculated points
  resource_name TEXT NOT NULL,
  resource_category TEXT NOT NULL,
  resource_status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**Fields:**
- `id` - Leaderboard entry ID (nanoid)
- `user_id` - User identifier (Discord nickname/username)
- `resource_id` - Reference to resources table
- `action_type` - Type of action performed
- `quantity_changed` - Amount changed
- `base_points` - Base points earned
- `resource_multiplier` - Resource-specific multiplier
- `status_bonus` - Bonus for resource status
- `final_points` - Total points after all multipliers
- `resource_name` - Denormalized resource name
- `resource_category` - Denormalized resource category
- `resource_status` - Resource status at time of action
- `created_at` - Action timestamp

## Indexes

The following indexes are automatically created:
- `users_discord_id_unique` on `users.discord_id`
- Primary key indexes on all `id` fields
- Foreign key indexes on reference fields

## Migration Commands

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:push
```

## Points Calculation

The leaderboard uses this formula:
```
final_points = base_points × resource_multiplier × (1 + status_bonus)
```

Where:
- `base_points` = `quantity_changed` × action multiplier
- `resource_multiplier` = per-resource multiplier (default 1.0)
- `status_bonus` = 0.0 (at_target), 0.05 (below_target), 0.10 (critical)

## Data Retention

- **Resource History**: Kept indefinitely for audit purposes
- **Leaderboard**: Kept indefinitely for historical rankings
- **User Sessions**: Cleared after 30 days
- **Users**: Kept until deletion requested (GDPR compliance)

## GDPR Compliance

The schema supports GDPR requirements:
- **Data Export**: All user data can be exported via API
- **Data Deletion**: User data can be anonymized while preserving statistics
- **Audit Trail**: Complete history of who accessed/changed what data