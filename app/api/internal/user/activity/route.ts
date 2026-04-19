import { NextRequest, NextResponse } from "next/server";
import { db, resourceHistory, resources } from "@/lib/db";
import { eq, gte, desc, and, or } from "drizzle-orm";
import {
  mapCategoryForRead,
  mapTransferDirectionForRead,
} from "@/lib/resource-mapping";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/user/activity
 *
 * Internal endpoint that returns resource history entries for a user or
 * globally. Accepts:
 * - `userId` — current user identifier (required unless `global=true`)
 * - `oldUserIds` — comma-separated list of legacy identifiers for backward
 *   compatibility (history recorded under old IDs is included)
 * - `days` — how many days of history to return (default: 30)
 * - `limit` — max entries to return (default: 500)
 * - `global=true` — return activity from all users instead
 *
 * Marked `force-dynamic`. Intended to be called only by the authenticated
 * `GET /api/user/activity` proxy.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.max(
      1,
      parseInt(searchParams.get("days") || "30", 10) || 30,
    );
    const isGlobal = searchParams.get("global") === "true";
    const limit = Math.max(
      1,
      Math.min(500, parseInt(searchParams.get("limit") || "500", 10) || 500),
    );
    const userId = searchParams.get("userId");
    const oldUserIdsString = searchParams.get("oldUserIds");
    const oldUserIds = oldUserIdsString
      ? oldUserIdsString.split(",").slice(0, 20)
      : [];

    if (!isGlobal && !userId) {
      return NextResponse.json(
        { error: "userId is required for non-global activity" },
        { status: 400 },
      );
    }

    // Calculate date threshold
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Fetch activity from database with resource names and categories
    const activity = await db
      .select({
        id: resourceHistory.id,
        resourceId: resourceHistory.resourceId,
        resourceName: resources.name,
        resourceCategory: resources.category,
        previousQuantityHagga: resourceHistory.previousQuantityHagga,
        newQuantityHagga: resourceHistory.newQuantityHagga,
        changeAmountHagga: resourceHistory.changeAmountHagga,
        previousQuantityDeepDesert: resourceHistory.previousQuantityDeepDesert,
        newQuantityDeepDesert: resourceHistory.newQuantityDeepDesert,
        changeAmountDeepDesert: resourceHistory.changeAmountDeepDesert,
        previousQuantityLocation1: resourceHistory.previousQuantityLocation1,
        newQuantityLocation1: resourceHistory.newQuantityLocation1,
        changeAmountLocation1: resourceHistory.changeAmountLocation1,
        previousQuantityLocation2: resourceHistory.previousQuantityLocation2,
        newQuantityLocation2: resourceHistory.newQuantityLocation2,
        changeAmountLocation2: resourceHistory.changeAmountLocation2,
        transferAmount: resourceHistory.transferAmount,
        transferDirection: resourceHistory.transferDirection,
        changeType: resourceHistory.changeType,
        reason: resourceHistory.reason,
        updatedBy: resourceHistory.updatedBy,
        createdAt: resourceHistory.createdAt,
      })
      .from(resourceHistory)
      .innerJoin(resources, eq(resourceHistory.resourceId, resources.id))
      .where(
        isGlobal
          ? gte(resourceHistory.createdAt, daysAgo)
          : and(
              // Check current nickname AND old identifiers for backward compatibility
              or(
                eq(resourceHistory.updatedBy, userId!),
                ...oldUserIds.map((id) =>
                  eq(resourceHistory.updatedBy, id as string),
                ),
              ),
              gte(resourceHistory.createdAt, daysAgo),
            ),
      )
      .orderBy(desc(resourceHistory.createdAt))
      .limit(limit);

    const processedActivity = activity.map((entry) => {
      const loc1Amount =
        entry.changeAmountLocation1 ?? entry.changeAmountHagga ?? 0;
      const loc2Amount =
        entry.changeAmountLocation2 ?? entry.changeAmountDeepDesert ?? 0;
      const totalChangeAmount = loc1Amount + loc2Amount;
      return {
        ...entry,
        resourceCategory: mapCategoryForRead(entry.resourceCategory),
        previousQuantityLocation1:
          entry.previousQuantityLocation1 ??
          entry.previousQuantityHagga ??
          null,
        newQuantityLocation1:
          entry.newQuantityLocation1 ?? entry.newQuantityHagga ?? null,
        changeAmountLocation1:
          entry.changeAmountLocation1 ?? entry.changeAmountHagga ?? null,
        previousQuantityLocation2:
          entry.previousQuantityLocation2 ??
          entry.previousQuantityDeepDesert ??
          null,
        newQuantityLocation2:
          entry.newQuantityLocation2 ?? entry.newQuantityDeepDesert ?? null,
        changeAmountLocation2:
          entry.changeAmountLocation2 ?? entry.changeAmountDeepDesert ?? null,
        transferDirection: mapTransferDirectionForRead(entry.transferDirection),
        changeAmount: totalChangeAmount,
      };
    });

    return NextResponse.json(processedActivity);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}
