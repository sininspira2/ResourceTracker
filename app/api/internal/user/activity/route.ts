import { NextRequest, NextResponse } from 'next/server'
import { db, resourceHistory, resources } from '@/lib/db'
import { eq, gte, desc, and, or } from 'drizzle-orm'

// GET /api/internal/user/activity - Get user's activity history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const isGlobal = searchParams.get('global') === 'true'
    const limit = parseInt(searchParams.get('limit') || '500')
    const userId = searchParams.get('userId')
    const oldUserIdsParam = searchParams.get('oldUserIds')
    const oldUserIds = oldUserIdsParam ? oldUserIdsParam.split(',') : []

    // Calculate date threshold
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)

    const whereClauses = [];
    if (userId) {
      whereClauses.push(eq(resourceHistory.updatedBy, userId));
    }
    if (oldUserIds.length > 0) {
      whereClauses.push(...oldUserIds.map(id => eq(resourceHistory.updatedBy, id as string)));
    }

    const userFilter = whereClauses.length > 0 ? or(...whereClauses) : undefined;

    const finalWhereClause = isGlobal
      ? gte(resourceHistory.createdAt, daysAgo)
      : and(
          userFilter,
          gte(resourceHistory.createdAt, daysAgo)
        );

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
      .where(finalWhereClause)
      .orderBy(desc(resourceHistory.createdAt))
      .limit(limit)

    const processedActivity = activity.map(entry => {
      const totalChangeAmount = (entry.changeAmountHagga || 0) + (entry.changeAmountDeepDesert || 0);
      return {
        ...entry,
        changeAmount: totalChangeAmount,
      };
    });

    return NextResponse.json(processedActivity, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}