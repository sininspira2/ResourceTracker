# ResourceTracker Database Migration Guide

This guide provides instructions for managing your Turso database schema and ensuring it stays synchronized with the application code.

- [Scenario 1: For New Users (Recommended)](#scenario-1-for-new-users-recommended)
- [Scenario 2: For Existing Users (Updating)](#scenario-2-for-existing-users-updating)
- [Scenario 3: For Legacy & Troubleshooting](#scenario-3-for-legacy--troubleshooting)

---

## Scenario 1: For New Users (Recommended)

If you are setting up the application for the first time with a new, empty database, simply run:

```bash
npm run db:migrate
```

This single command will create all the necessary tables by applying every existing migration file and will log them correctly in the `__drizzle_migrations` table. This is the simplest and most reliable way to start.

---

## Scenario 2: For Existing Users (Updating)

If you have an existing database and a new migration has been added to the project (e.g., after pulling new code):

1.  Pull the latest changes from the repository.
2.  Run `npm install` to get any new dependencies.
3.  **Run the Baselining Script:**
    ```bash
    npm run db:log-init
    ```
    This special script will create the `__drizzle_migrations` table (if it doesn't exist) and log the *initial* migration hash. It **does not** run any migrations. This tells Drizzle to assume the first migration is already applied.
4.  **Run Standard Migration:**
    ```bash
    npm run db:migrate
    ```
    This will now correctly apply any *subsequent* migrations (like `0001_...`, `0002_...`, etc.) without error.
    
6.  Going forward, if there are any database migrations, you will only need to run `npm run db:migrate`.

---

## Scenario 3: For Legacy & Troubleshooting

This section covers special cases, such as migrating from a very old version of the project or fixing a corrupted migration table.

### Use Case: Migrating from `gazreyn/ResourceTracker` or upgrading from v3.x

If you are migrating from a legacy version, your database might have the correct schema but no `__drizzle_migrations` table. If you run `npm run db:migrate`, it will fail because it will try to re-apply migrations for tables that already exist.

To fix this, you must first "baseline" your database:

1.  **Run Manual SQL (If Needed):** If you are coming from a very old version, you may need to run manual SQL commands to update your schema to a point where migrations can take over. The commands for `gazreyn/ResourceTracker` and `v3.x` are listed below. If you are unsure, it is safe to run them; they will not harm an up-to-date schema.

#### Manual SQL for `gazreyn/ResourceTracker` Migrators

```sql
ALTER TABLE `resources` ADD `is_priority` integer DEFAULT 0 NOT NULL;
ALTER TABLE `resource_history` RENAME COLUMN `previous_quantity` TO `previous_quantity_hagga`;
ALTER TABLE `resource_history` RENAME COLUMN `new_quantity` TO `new_quantity_hagga`;
ALTER TABLE `resource_history` RENAME COLUMN `change_amount` TO `change_amount_hagga`;
ALTER TABLE `resources` RENAME COLUMN `quantity` TO `quantity_hagga`;
ALTER TABLE `resource_history` ADD COLUMN `previous_quantity_deep_desert` integer NOT NULL;
ALTER TABLE `resource_history` ADD COLUMN `new_quantity_deep_desert` integer NOT NULL;
ALTER TABLE `resource_history` ADD COLUMN `change_amount_deep_desert` integer NOT NULL;
ALTER TABLE `resource_history` ADD COLUMN `transfer_amount` integer;
ALTER TABLE `resource_history` ADD COLUMN `transfer_direction` text;
ALTER TABLE `resources` ADD COLUMN `quantity_deep_desert` integer DEFAULT 0 NOT NULL;
DROP TABLE IF EXISTS __drizzle_migrations;
```
#### Manual SQL for `v3.x` Upgraders

```sql
ALTER TABLE `resources` ADD `is_priority` integer DEFAULT 0 NOT NULL;
DROP TABLE IF EXISTS __drizzle_migrations;
```

2.  **Run the Baselining Script:**
    ```bash
    npm run db:log-init
    ```
    This special script will create the `__drizzle_migrations` table (if it doesn't exist) and log the *initial* migration hash. It **does not** run any migrations. This tells Drizzle to assume the first migration is already applied.
3.  **Run Standard Migration:**
    ```bash
    npm run db:migrate
    ```
    This will now correctly apply any *subsequent* migrations (like `0001_...`, `0002_...`, etc.) without error.


---

### How the New Migration System Works (For Developers)

-   The application no longer uses migration tags. Instead, it uses SHA256 hashes of the `.sql` migration files.
-   When you run `npm run build` or `npm run db:generate`, a script automatically generates `lib/migration-hashes.ts`. This file contains an array of all migration hashes.
-   At runtime, the application compares the latest hash from the database with the latest hash in that file to determine if the database is up-to-date.
-   There are no manual steps required after generating a migration.
---
