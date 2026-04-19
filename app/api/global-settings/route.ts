import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocationNames, LOCATION_1_NAME_KEY, LOCATION_2_NAME_KEY } from "@/lib/global-settings";
import { db, globalSettings } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/global-settings
 *
 * Returns the configured display names for the two inventory locations.
 * Falls back to "Hagga" / "Deep Desert" when the settings are missing.
 *
 * Requires an authenticated session.
 */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { location1Name, location2Name } = await getLocationNames();
    return NextResponse.json(
      { location1Name, location2Name },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching global settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch global settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/global-settings
 *
 * Updates the inventory location display names. Admin-only.
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.permissions?.hasResourceAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { location1Name, location2Name } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof location1Name !== "string" ||
    location1Name.trim().length === 0 ||
    location1Name.trim().length > 50 ||
    typeof location2Name !== "string" ||
    location2Name.trim().length === 0 ||
    location2Name.trim().length > 50
  ) {
    return NextResponse.json({ error: "Invalid location names" }, { status: 400 });
  }

  const trimmed1 = location1Name.trim();
  const trimmed2 = location2Name.trim();

  try {
    const now = new Date();
    await db
      .insert(globalSettings)
      .values([
        {
          settingKey: LOCATION_1_NAME_KEY,
          settingValue: trimmed1,
          description: "Display name for inventory location 1",
          createdAt: now,
          lastUpdatedAt: now,
        },
        {
          settingKey: LOCATION_2_NAME_KEY,
          settingValue: trimmed2,
          description: "Display name for inventory location 2",
          createdAt: now,
          lastUpdatedAt: now,
        },
      ])
      .onConflictDoUpdate({
        target: globalSettings.settingKey,
        set: {
          settingValue: sql`excluded.setting_value`,
          lastUpdatedAt: now,
        },
      });

    return NextResponse.json({ location1Name: trimmed1, location2Name: trimmed2 });
  } catch (error) {
    console.error("Error updating global settings:", error);
    return NextResponse.json(
      { error: "Failed to update global settings" },
      { status: 500 },
    );
  }
}
