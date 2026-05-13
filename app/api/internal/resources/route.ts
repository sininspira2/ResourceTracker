import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, resources, users } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { hasResourceAccess } from "@/lib/discord-roles";
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
  const session = await getServerSession(authOptions);
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allResources = await db.select().from(resources);
    const mapped = allResources.map(mapResourceRowForRead);

    // Resolve Discord IDs in lastUpdatedBy to display names; entries stored
    // before the migration (with nicknames) won't match and fall back as-is.
    const updaterIds = [
      ...new Set(mapped.map((r) => r.lastUpdatedBy as string)),
    ].filter(Boolean);
    let displayNameMap: Record<string, string> = {};
    if (updaterIds.length > 0) {
      const usersResult = await db
        .select({
          discordId: users.discordId,
          customNickname: users.customNickname,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.discordId, updaterIds));
      displayNameMap = Object.fromEntries(
        usersResult.map((u) => [u.discordId, u.customNickname || u.username]),
      );
    }

    return NextResponse.json(
      mapped.map((r) => ({
        ...r,
        lastUpdatedBy:
          displayNameMap[r.lastUpdatedBy as string] ||
          (r.lastUpdatedBy as string),
      })),
    );
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}
