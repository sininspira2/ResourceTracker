import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, resourceHistory } from "@/lib/db";
import { gte, desc } from "drizzle-orm";
import { hasResourceAccess } from "@/lib/discord-roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/resources/sparklines?days=30
 *
 * Returns daily quantity totals for all resources over the last `days` days
 * (default: 30). For resources with fewer than 2 data points in that window,
 * falls back to their all-time history.
 *
 * Response shape: `{ [resourceId]: number[] }` — oldest-first daily totals.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.max(
      1,
      Math.min(500, parseInt(searchParams.get("days") || "30", 10) || 30),
    );

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const recentRows = await db
      .select({
        resourceId: resourceHistory.resourceId,
        newQuantityHagga: resourceHistory.newQuantityHagga,
        newQuantityDeepDesert: resourceHistory.newQuantityDeepDesert,
        newQuantityLocation1: resourceHistory.newQuantityLocation1,
        newQuantityLocation2: resourceHistory.newQuantityLocation2,
        createdAt: resourceHistory.createdAt,
      })
      .from(resourceHistory)
      .where(gte(resourceHistory.createdAt, daysAgo))
      .orderBy(desc(resourceHistory.createdAt));

    // Group rows by resourceId → day → last entry per day
    const byResource: Record<
      string,
      { day: string; total: number }[]
    > = {};

    for (const row of recentRows) {
      const qty1 = row.newQuantityLocation1 ?? row.newQuantityHagga;
      const qty2 = row.newQuantityLocation2 ?? row.newQuantityDeepDesert;
      const total = qty1 + qty2;
      const day = new Date(row.createdAt).toISOString().slice(0, 10);
      const rid = row.resourceId;

      if (!byResource[rid]) byResource[rid] = [];
      // Since rows are ordered desc, the first time we see a day is the latest entry for it
      if (!byResource[rid].some((e) => e.day === day)) {
        byResource[rid].push({ day, total });
      }
    }

    // Build result: oldest-first arrays. Collect resourceIds with < 2 points.
    const result: Record<string, number[]> = {};
    const needsFallback: string[] = [];

    for (const [rid, entries] of Object.entries(byResource)) {
      if (entries.length < 2) {
        needsFallback.push(rid);
      } else {
        result[rid] = entries
          .slice()
          .sort((a, b) => a.day.localeCompare(b.day))
          .map((e) => e.total);
      }
    }

    // All-time fallback for resources with insufficient recent data
    if (needsFallback.length > 0) {
      const allTimeRows = await db
        .select({
          resourceId: resourceHistory.resourceId,
          newQuantityHagga: resourceHistory.newQuantityHagga,
          newQuantityDeepDesert: resourceHistory.newQuantityDeepDesert,
          newQuantityLocation1: resourceHistory.newQuantityLocation1,
          newQuantityLocation2: resourceHistory.newQuantityLocation2,
          createdAt: resourceHistory.createdAt,
        })
        .from(resourceHistory)
        .orderBy(desc(resourceHistory.createdAt));

      const allTimeByResource: Record<
        string,
        { day: string; total: number }[]
      > = {};

      for (const row of allTimeRows) {
        const rid = row.resourceId;
        if (!needsFallback.includes(rid)) continue;
        const qty1 = row.newQuantityLocation1 ?? row.newQuantityHagga;
        const qty2 = row.newQuantityLocation2 ?? row.newQuantityDeepDesert;
        const total = qty1 + qty2;
        const day = new Date(row.createdAt).toISOString().slice(0, 10);

        if (!allTimeByResource[rid]) allTimeByResource[rid] = [];
        if (!allTimeByResource[rid].some((e) => e.day === day)) {
          allTimeByResource[rid].push({ day, total });
        }
      }

      for (const rid of needsFallback) {
        const entries = allTimeByResource[rid];
        if (entries && entries.length >= 2) {
          result[rid] = entries
            .slice()
            .sort((a, b) => a.day.localeCompare(b.day))
            .map((e) => e.total);
        }
        // Resources with < 2 all-time entries are omitted (no sparkline shown)
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching sparklines:", error);
    return NextResponse.json(
      { error: "Failed to fetch sparklines" },
      { status: 500 },
    );
  }
}
