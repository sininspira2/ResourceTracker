import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const allowedTimeFilters = ["24h", "7d", "30d", "all"];
    const timeFilterInput = searchParams.get("timeFilter") || "all";
    const timeFilter = allowedTimeFilters.includes(timeFilterInput) ? timeFilterInput as "24h" | "7d" | "30d" | "all" : "all";

    const limit = parseInt(searchParams.get("limit") || "50", 10) || 50;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10) || 20;

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    const effectiveLimit = searchParams.get("limit") ? limit : pageSize;

    const result = await getLeaderboard(timeFilter, effectiveLimit, offset);

    return NextResponse.json(
      {
        leaderboard: result.rankings,
        timeFilter,
        total: result.total,
        page,
        pageSize: effectiveLimit,
        totalPages: Math.ceil(result.total / effectiveLimit),
        hasNextPage: offset + effectiveLimit < result.total,
        hasPrevPage: page > 1,
      },
    );
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}