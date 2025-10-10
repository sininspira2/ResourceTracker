import { NextRequest, NextResponse } from "next/server";
import { db, resourceHistory, resources } from "@/lib/db";
import { eq, gte, desc, and, or } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// GET /api/internal/user/activity - Get user's activity history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const isGlobal = searchParams.get("global") === "true";
    const limit = parseInt(searchParams.get("limit") || "500", 10);
    const userId = searchParams.get("userId");
    const oldUserIdsString = searchParams.get("oldUserIds");
    const oldUserIds = oldUserIdsString ? oldUserIdsString.split(',') : [];

    if (!isGlobal && !userId) {
      return NextResponse.json({ error: "userId is required for non-global activity" }, { status: 400 });
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
      const totalChangeAmount =
        (entry.changeAmountHagga || 0) + (entry.changeAmountDeepDesert || 0);
      return {
        ...entry,
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