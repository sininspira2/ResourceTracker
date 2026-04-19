import { createClient } from "@libsql/client";

async function runBackfill() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.warn("Skipping backfill: TURSO_DATABASE_URL not found.");
    return;
  }

  const client = createClient({ url, authToken });

  try {
    // Check 1: Has this already been completed?
    const flagCheck = await client.execute(
      `SELECT setting_value FROM global_settings WHERE setting_key = 'inventory_data_backfilled'`
    );

    if (flagCheck.rows.length > 0 && flagCheck.rows[0].setting_value === 'true') {
      console.log("Data backfill already completed in a previous build. Skipping.");
      return;
    }

    // Check 2: Do the new columns exist yet?
    try {
      await client.execute(`SELECT quantity_location_1 FROM resources LIMIT 1`);
    } catch (e) {
      console.warn("Target columns do not exist. Schema migration likely hasn't run. Skipping backfill.");
      return;
    }

    console.log("Starting historical data backfill for inventory locations...");

    const resUpdate = await client.execute(`
      UPDATE resources
      SET
        quantity_location_1 = quantity_hagga,
        quantity_location_2 = quantity_deep_desert;
    `);
    console.log(`Resources backfilled: ${resUpdate.rowsAffected} rows affected.`);

    const historyUpdate = await client.execute(`
      UPDATE resource_history
      SET
        previous_quantity_location_1 = previous_quantity_hagga,
        new_quantity_location_1 = new_quantity_hagga,
        change_amount_location_1 = change_amount_hagga,
        previous_quantity_location_2 = previous_quantity_deep_desert,
        new_quantity_location_2 = new_quantity_deep_desert,
        change_amount_location_2 = change_amount_deep_desert;
    `);
    console.log(`History backfilled: ${historyUpdate.rowsAffected} rows affected.`);

    const directionUpdate = await client.execute(`
      UPDATE resource_history
      SET transfer_direction =
        CASE
          WHEN transfer_direction = 'to_hagga' THEN 'to_location_1'
          WHEN transfer_direction = 'to_deep_desert' THEN 'to_location_2'
          ELSE transfer_direction
        END
      WHERE transfer_direction IN ('to_hagga', 'to_deep_desert');
    `);
    console.log(`Transfer directions updated: ${directionUpdate.rowsAffected} rows affected.`);

    const timestamp = Date.now();
    await client.execute(`
      INSERT INTO global_settings (setting_key, setting_value, description, created_at, last_updated_at)
      VALUES (
        'inventory_data_backfilled',
        'true',
        'Tracks if legacy Hagga/Deep Desert data was migrated to Location 1/2',
        ${timestamp},
        ${timestamp}
      )
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = 'true',
        last_updated_at = ${timestamp};
    `);

    console.log("Backfill complete and flagged in global_settings.");

  } catch (error) {
    console.error("Critical error during backfill:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runBackfill();
