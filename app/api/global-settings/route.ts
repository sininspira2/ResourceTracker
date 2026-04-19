import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocationNames } from "@/lib/global-settings";

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
