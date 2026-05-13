import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, resourceHistory, users } from "@/lib/db";
import { eq, gte, desc, and, inArray } from "drizzle-orm";
import { hasResourceAccess } from "@/lib/discord-roles";
import { mapHistoryRowForRead } from "@/lib/resource-mapping";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/resources/[id]/history
 *
 * Internal endpoint that returns up to 100 history entries for a resource,
 * filtered to the last `days` days (default: 7). Results are ordered
 * newest-first. Intended to be called only by the authenticated
 * `GET /api/resources/[id]/history` proxy. Marked `force-dynamic`.
 *
 * Applies fallback mapping so location-agnostic tracking columns fall back to
 * their legacy Hagga/Deep Desert counterparts, and legacy `transferDirection`
 * strings are translated to their `transfer_to_location_{1,2}` equivalents.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.max(
      1,
      Math.min(500, parseInt(searchParams.get("days") || "7", 10) || 7),
    );
    const { id: resourceId } = await params;

    // Calculate date threshold
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Fetch history from database
    const history = await db
      .select()
      .from(resourceHistory)
      .where(
        and(
          eq(resourceHistory.resourceId, resourceId),
          gte(resourceHistory.createdAt, daysAgo),
        ),
      )
      .orderBy(desc(resourceHistory.createdAt))
      .limit(100); // Limit to reduce load

    // Resolve Discord IDs to display names; entries stored before the migration
    // (with nicknames as updatedBy) won't match and fall back to the stored value.
    const updaterIds = [...new Set(history.map((h) => h.updatedBy))].filter(
      Boolean,
    );
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

    const mapped = history.map((row) => ({
      ...mapHistoryRowForRead(row),
      updatedBy: displayNameMap[row.updatedBy] || row.updatedBy,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching resource history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
