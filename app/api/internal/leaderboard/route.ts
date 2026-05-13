import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";
import { db, users } from "@/lib/db";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/leaderboard
 *
 * Internal endpoint that returns paginated leaderboard rankings. Validates the
 * `timeFilter` query parameter against the allowed set (`"24h"`, `"7d"`,
 * `"30d"`, `"all"`), defaulting to `"all"` for invalid values. Supports
 * `limit`, `page`, and `pageSize` query parameters. Marked `force-dynamic`.
 *
 * Intended to be called only by the authenticated `GET /api/leaderboard` proxy.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const allowedTimeFilters = ["24h", "7d", "30d", "all"];
    const timeFilterInput = searchParams.get("timeFilter") || "all";
    const timeFilter = allowedTimeFilters.includes(timeFilterInput)
      ? (timeFilterInput as "24h" | "7d" | "30d" | "all")
      : "all";

    const limit = Math.max(
      1,
      Math.min(500, parseInt(searchParams.get("limit") || "50", 10) || 50),
    );
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1,
    );
    const pageSize = Math.max(
      1,
      Math.min(500, parseInt(searchParams.get("pageSize") || "20", 10) || 20),
    );

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    const effectiveLimit = searchParams.get("limit") ? limit : pageSize;

    const result = await getLeaderboard(timeFilter, effectiveLimit, offset);

    // Resolve Discord IDs to display names; old entries (stored as nicknames)
    // won't match discordId and fall back to the stored value.
    const discordIds = result.rankings.map((r) => r.userId).filter(Boolean);
    let displayNameMap: Record<string, string> = {};
    if (discordIds.length > 0) {
      const usersResult = await db
        .select({
          discordId: users.discordId,
          customNickname: users.customNickname,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.discordId, discordIds));
      displayNameMap = Object.fromEntries(
        usersResult.map((u) => [
          u.discordId,
          u.customNickname || u.username,
        ]),
      );
    }

    const rankingsWithNames = result.rankings.map((r) => ({
      ...r,
      displayName: displayNameMap[r.userId] || r.userId,
    }));

    return NextResponse.json({
      leaderboard: rankingsWithNames,
      timeFilter,
      total: result.total,
      page,
      pageSize: effectiveLimit,
      totalPages: Math.ceil(result.total / effectiveLimit),
      hasNextPage: offset + effectiveLimit < result.total,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
