import { NextRequest, NextResponse } from "next/server";
import { db, resources } from "@/lib/db";
import { mapResourceRowForRead } from "@/lib/resource-mapping";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/resources
 *
 * Internal, unauthenticated endpoint that returns all resources from the
 * database. Intended to be called only by the public-facing
 * `GET /api/resources` route (which handles auth). Marked
 * `force-dynamic` to opt out of Next.js static caching.
 *
 * Applies fallback mapping so location-agnostic quantity fields fall back to
 * their legacy Hagga/Deep Desert counterparts, and the legacy "Blueprints"
 * category is returned as "Gear Blueprints".
 */
export async function GET(request: NextRequest) {
  try {
    const allResources = await db.select().from(resources);

    return NextResponse.json(allResources.map(mapResourceRowForRead));
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}
