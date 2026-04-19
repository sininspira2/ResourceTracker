import { db, globalSettings } from "./db";
import { inArray } from "drizzle-orm";

export const LOCATION_1_NAME_KEY = "inventory_location_1_name";
export const LOCATION_2_NAME_KEY = "inventory_location_2_name";

export const DEFAULT_LOCATION_1_NAME = "Hagga";
export const DEFAULT_LOCATION_2_NAME = "Deep Desert";

export interface LocationNames {
  location1Name: string;
  location2Name: string;
}

/**
 * Read the configured display names for the two inventory locations from the
 * global_settings table. Falls back to "Hagga" / "Deep Desert" when the keys
 * are missing, null, or empty.
 */
export async function getLocationNames(
  dbInstance: any = db,
): Promise<LocationNames> {
  try {
    const rows = await dbInstance
      .select()
      .from(globalSettings)
      .where(
        inArray(globalSettings.settingKey, [
          LOCATION_1_NAME_KEY,
          LOCATION_2_NAME_KEY,
        ]),
      );

    const byKey = new Map<string, string | null | undefined>();
    for (const row of rows) {
      byKey.set(row.settingKey, row.settingValue);
    }

    const rawLoc1 = byKey.get(LOCATION_1_NAME_KEY);
    const rawLoc2 = byKey.get(LOCATION_2_NAME_KEY);

    const location1Name =
      typeof rawLoc1 === "string" && rawLoc1.trim().length > 0
        ? rawLoc1
        : DEFAULT_LOCATION_1_NAME;
    const location2Name =
      typeof rawLoc2 === "string" && rawLoc2.trim().length > 0
        ? rawLoc2
        : DEFAULT_LOCATION_2_NAME;

    return { location1Name, location2Name };
  } catch (error) {
    console.error("Error fetching location names from global_settings:", error);
    return {
      location1Name: DEFAULT_LOCATION_1_NAME,
      location2Name: DEFAULT_LOCATION_2_NAME,
    };
  }
}
