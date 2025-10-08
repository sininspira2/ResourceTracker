# ResourceTracker Database Migration Guide

This guide provides manual SQL scripts to update your Turso database schema, ensuring data preservation during specific migration or upgrade scenarios.

- [Scenario 1: Migrating from gazreyn/ResourceTracker](#scenario-1-migrating-from-gazreynresourcetracker)

- [Scenario 2: Upgrading from v3.x to v4.x](#scenario-2-upgrading-from-v3x-to-v4x)

- [Scenario 3: No Migration Table OR Cannot Run db:migrate](#scenario-3-no-migration-table-or-cannot-run-dbmigrate)


## Scenario 1: Migrating from `gazreyn/ResourceTracker`

⚠️ The standard Drizzle migration can lead to data loss when used with Turso. To migrate your existing data safely, follow these steps.

1.  Navigate to [turso.tech](https://turso.tech) and log in.
2.  Select your **Resource Tracker** database.
3.  From the **Overview** tab, navigate to the **Edit Data** tab.
4.  In the left-hand panel, click on **SQL Console**.
5.  Clear any existing commands from the SQL editor text box.
6.  Copy and paste the entire script below into the editor:
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
    ```
7. Click the dropdown arrow (`˅`) next to the **Run** button and select **Run All**.
8. Also run this SQL command separately, after completing the above:

   ```sql
   DROP TABLE __drizzle_migrations
   ```
    *Note: (this may fail; that is okay)*

10.  From your local git folder that you cloned during setup, run `git fetch`
11.  Then run `npm run db:log-init`
---

## Scenario 2: Upgrading from v3.x to v4.x

If you upgraded from a `3.x` version to `4.x` and can no longer edit resource metadata, apply this simple fix.

1.  Follow steps 1-5 from the guide above to open the **SQL Console** for your database.
2.  Copy and paste the following command into the editor:
    ```sql
    ALTER TABLE `resources` ADD `is_priority` integer DEFAULT 0 NOT NULL;
    ```
3.  Click the green **Run** button to execute the command.
4.  Also run this SQL command separately, after completing the above:

   ```sql
   DROP TABLE __drizzle_migrations
   ```
*Note: (this may fail; that is okay)*

5.  From your local git folder that you cloned during setup, run `git fetch`
6.  Then run `npm run db:log-init`
---

## Scenario 3: Standard Setup and Updates

This section covers the standard workflow for setting up a new database or updating an existing one that is already using Drizzle migrations.

### 🚀 For New Users (First-Time Setup)

If you are setting up Resource Tracker for the first time with a new, empty database, the process is simple. Run the following command to create all tables and apply all migrations:

```bash
npm run db:migrate
```

This single command will bring your database schema completely up-to-date.

### ⚠️ For Existing Users (Updating an Old Database)

If you have an existing Resource Tracker database that was created *before* the Drizzle migration tracking system was in place (i.e., you have data but no `__drizzle_migrations` table), you must follow a two-step process to update your schema without errors.

**Step 1: Baseline Your Database**

First, run the `db:log-init` script. This command will create the `__drizzle_migrations` table and log the initial schema state, preventing Drizzle from trying to re-create tables that already exist.

```bash
npm run db:log-init
```

**Step 2: Apply New Migrations**

After baselining your database, you can now safely apply any new migrations that have been added since your initial setup.

```bash
npm run db:migrate
```

For all future updates, you will only need to run `npm run db:migrate`.

---

## ⚙️ How Migration Status is Checked

The application automatically checks if the database schema is up-to-date by comparing the latest migration recorded in the `__drizzle_migrations` table against a pre-built list of migration hashes.

This process is fully automated. The list of hashes is generated automatically when new migrations are created, so no manual intervention is required. If the application detects that your database schema is out of date, it will display a warning banner.
