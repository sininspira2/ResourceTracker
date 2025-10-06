# 🗄️ Database Schema

This document describes the database schema used by Resource Tracker, built with Drizzle ORM and SQLite (Turso).

## Overview

The application uses 5 main tables:
-   `users` - Discord user information
-   `user_sessions` - Session data for role caching
-   `resources` - Resource definitions and current quantities for both locations
-   `resource_history` - Audit trail of all resource changes, including transfers
-   `leaderboard` - Points and contribution tracking

## Table Definitions

### `users`
Stores essential Discord user information.

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

### `user_sessions`
Caches Discord role and guild membership data to minimize API calls to Discord.

```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  roles TEXT NOT NULL, -- JSON array of role IDs
  is_in_guild INTEGER NOT NULL, -- Boolean (0/1)
  created_at INTEGER NOT NULL
);
```

### `resources`
The core table for resource definitions, tracking quantities at two separate locations.

```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity_hagga INTEGER NOT NULL DEFAULT 0,
  quantity_deep_desert INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  icon TEXT,
  image_url TEXT,
  status TEXT, -- 'at_target', 'below_target', 'critical'
  target_quantity INTEGER,
  multiplier REAL NOT NULL DEFAULT 1.0,
  is_priority INTEGER NOT NULL DEFAULT 0, -- Boolean (0/1)
  last_updated_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```
**Fields:**
- `quantity_hagga`: Current quantity at the "Hagga" location.
- `quantity_deep_desert`: Current quantity at the "Deep Desert" location.
- `is_priority`: A boolean flag to mark important resources.

### `resource_history`
A detailed audit trail for every change made to resource quantities, including transfers between locations.

```sql
CREATE TABLE resource_history (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  previous_quantity_hagga INTEGER NOT NULL,
  new_quantity_hagga INTEGER NOT NULL,
  change_amount_hagga INTEGER NOT NULL,
  previous_quantity_deep_desert INTEGER NOT NULL,
  new_quantity_deep_desert INTEGER NOT NULL,
  change_amount_deep_desert INTEGER NOT NULL,
  change_type TEXT NOT NULL, -- 'absolute', 'relative', or 'transfer'
  updated_by TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL,
  transfer_amount INTEGER,
  transfer_direction TEXT -- 'to_deep_desert' or 'to_hagga'
);
```
**Fields:**
- Contains separate `previous_`, `new_`, and `change_amount_` fields for both `hagga` and `deep_desert` to provide a complete before-and-after snapshot.
- `transfer_amount` & `transfer_direction`: Specifically log details of transfer operations.

### `leaderboard`
Stores records of user contributions for gamification and ranking.

```sql
CREATE TABLE leaderboard (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  action_type TEXT NOT NULL, -- 'ADD', 'SET', 'REMOVE'
  quantity_changed INTEGER NOT NULL,
  base_points REAL NOT NULL,
  resource_multiplier REAL NOT NULL,
  status_bonus REAL NOT NULL,
  final_points REAL NOT NULL,
  resource_name TEXT NOT NULL,
  resource_category TEXT NOT NULL,
  resource_status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

## Indexes

-   `users_discord_id_unique` on `users.discord_id`
-   Primary key indexes on all `id` fields.
-   Foreign key indexes on reference fields (`user_id`, `resource_id`).

## Migration Commands

Use Drizzle Kit to manage schema changes.

```bash
# Generate migration files based on schema changes in lib/db.ts
npm run db:generate

# Apply generated migrations to the database
npm run db:push
```