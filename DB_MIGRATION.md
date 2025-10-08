# ResourceTracker Database Migration Guide

This guide provides manual SQL scripts to update your Turso database schema, ensuring data preservation during specific migration or upgrade scenarios.

---

## ⚠️ Important: After Creating a New Migration

Whenever you generate a new database migration using `npm run db:generate`, you **must** perform one manual step to ensure the application's migration-check banner works correctly.

1.  After the migration is generated, a new tag will be created in `drizzle/meta/_journal.json`.
2.  Open the `lib/constants.ts` file.
3.  Find the `LATEST_MIGRATION_TAG` constant.
4.  Update its value to match the **newest tag** from the `_journal.json` file.

**Example:**
If you generate a new migration and the journal file's last entry is `"tag": "0001_new_migration"`, you must update the constant to be:
`export const LATEST_MIGRATION_TAG = '0001_new_migration';`

Failure to do this will cause a warning banner to incorrectly appear at the top of the application for all users.

---

## Migrating from `gazreyn/ResourceTracker`

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

## Upgrading from v3.x to v4.x

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

## No Migration Table OR Cannot Run db:migrate

1. From your local git folder that you cloned during setup, run `git fetch`
2. Run `npm run db:log-init`
3. If a database migration is necessary, run `npm run db:migrate`
