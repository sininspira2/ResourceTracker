import { db, leaderboard, resources } from './db'
import { eq, desc, sql, and, gte } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Constants for points calculation
const BASE_POINTS_PER_1000_RESOURCES = 100
const SET_ACTION_POINTS = 1
const REFINED_ACTION_POINTS = 2 // Special points for Refined category

// Status bonuses (as decimal percentages)
const STATUS_BONUSES = {
  critical: 0.10,        // +10%
  below_target: 0.05,    // +5%
  at_target: 0.0,        // 0%
  above_target: 0.0,     // 0%
  well_stocked: 0.0,     // 0%
  surplus: 0.0           // 0%
}

// Categories that are eligible for points (Raw, Components, and Refined)
const ELIGIBLE_CATEGORIES = ['Raw', 'Components', 'Refined']

export interface PointsCalculation {
  basePoints: number
  resourceMultiplier: number
  statusBonus: number
  finalPoints: number
}

/**
 * Calculate points for a resource action
 */
export function calculatePoints(
  actionType: 'ADD' | 'SET' | 'REMOVE',
  quantityChanged: number,
  resourceMultiplier: number,
  resourceStatus: string,
  resourceCategory: string
): PointsCalculation {
  // No points for REMOVE actions or ineligible categories
  if (actionType === 'REMOVE' || !ELIGIBLE_CATEGORIES.includes(resourceCategory as any)) {
    return {
      basePoints: 0,
      resourceMultiplier,
      statusBonus: 0,
      finalPoints: 0
    }
  }

  // Special handling for Refined category - always 100 points flat
  if (resourceCategory === 'Refined') {
    return {
      basePoints: REFINED_ACTION_POINTS,
      resourceMultiplier: 0, // Show as 0x for refined
      statusBonus: 0,
      finalPoints: REFINED_ACTION_POINTS
    }
  }

  let basePoints = 0
  
  if (actionType === 'SET') {
    // SET actions get fixed points regardless of quantity - NO MULTIPLIERS OR BONUSES
    return {
      basePoints: SET_ACTION_POINTS,
      resourceMultiplier: 1.0,
      statusBonus: 0,
      finalPoints: SET_ACTION_POINTS
    }
  } else if (actionType === 'ADD') {
    // ADD actions get points based on quantity added (0.1 points per resource, so 100 points per 1000)
    basePoints = (quantityChanged / 1000) * BASE_POINTS_PER_1000_RESOURCES
  }

  // Apply resource multiplier (only for ADD actions)
  const multipliedPoints = basePoints * resourceMultiplier

  // Apply status bonus (only for ADD actions)
  const statusBonus = STATUS_BONUSES[resourceStatus as keyof typeof STATUS_BONUSES] || 0
  const statusBonusAmount = multipliedPoints * statusBonus
  const finalPoints = multipliedPoints + statusBonusAmount

  console.log(`Points calculation: resource=${resourceCategory}, status=${resourceStatus}, statusBonus=${statusBonus}, multipliedPoints=${multipliedPoints}, statusBonusAmount=${statusBonusAmount}, finalPoints=${finalPoints}`)

  return {
    basePoints,
    resourceMultiplier,
    statusBonus,
    finalPoints: Math.round(finalPoints * 100) / 100 // Round to 2 decimal places
  }
}

/**
 * Award points to a user for a resource action
 */
export async function awardPoints(
  userId: string,
  resourceId: string,
  actionType: 'ADD' | 'SET' | 'REMOVE',
  quantityChanged: number,
  resourceData: {
    name: string
    category: string
    status: string
    multiplier: number
  },
  dbInstance: any = db
): Promise<PointsCalculation> {
  const calculation = calculatePoints(
    actionType,
    quantityChanged,
    resourceData.multiplier,
    resourceData.status,
    resourceData.category
  )

  // Only create leaderboard entry if points were earned
  if (calculation.finalPoints > 0) {
    await dbInstance.insert(leaderboard).values({
      id: nanoid(),
      userId,
      resourceId,
      actionType,
      quantityChanged,
      basePoints: calculation.basePoints,
      resourceMultiplier: calculation.resourceMultiplier,
      statusBonus: calculation.statusBonus,
      finalPoints: calculation.finalPoints,
      resourceName: resourceData.name,
      resourceCategory: resourceData.category,
      resourceStatus: resourceData.status,
      createdAt: new Date(),
    })
  }

  return calculation
}

/**
 * Get leaderboard rankings with optional time filtering and pagination
 */
export async function getLeaderboard(
  timeFilter?: '24h' | '7d' | '30d' | 'all', 
  limit = 50, 
  offset = 0
): Promise<{ rankings: any[], total: number }> {
  try {
    let timeCondition = sql`1 = 1` // Default to no time filter

    if (timeFilter && timeFilter !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (timeFilter) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      timeCondition = gte(leaderboard.createdAt, cutoffDate!)
    }

    console.log(`Fetching leaderboard with filter: ${timeFilter}, limit: ${limit}, offset: ${offset}`)

    // Get total count for pagination
    const totalResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${leaderboard.userId})`.as('count')
      })
      .from(leaderboard)
      .where(timeCondition)

    const total = totalResult[0]?.count || 0

    const rankings = await db
      .select({
        userId: leaderboard.userId,
        totalPoints: sql<number>`SUM(${leaderboard.finalPoints})`.as('totalPoints'),
        totalActions: sql<number>`COUNT(*)`.as('totalActions'),
      })
      .from(leaderboard)
      .where(timeCondition)
      .groupBy(leaderboard.userId)
      .orderBy(desc(sql`SUM(${leaderboard.finalPoints})`))
      .limit(limit)
      .offset(offset)

    console.log(`Leaderboard query returned ${rankings.length} entries, total: ${total}`)
    return { rankings, total }
  } catch (error) {
    console.error('Error in getLeaderboard:', error)
    return { rankings: [], total: 0 }
  }
}

/**
 * Get detailed user contributions with pagination
 */
export async function getUserContributions(
  userId: string, 
  timeFilter?: '24h' | '7d' | '30d' | 'all',
  limit = 100,
  offset = 0
): Promise<{ contributions: any[], summary: any, total: number }> {
  let timeCondition = sql`1 = 1`

  if (timeFilter && timeFilter !== 'all') {
    const now = new Date()
    let cutoffDate: Date

    switch (timeFilter) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    timeCondition = gte(leaderboard.createdAt, cutoffDate!)
  }

  // Get total count for pagination
  const totalResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(leaderboard)
    .where(and(eq(leaderboard.userId, userId), timeCondition))

  const total = totalResult[0]?.count || 0

  const contributions = await db
    .select()
    .from(leaderboard)
    .where(and(eq(leaderboard.userId, userId), timeCondition))
    .orderBy(desc(leaderboard.createdAt))
    .limit(limit)
    .offset(offset)

  const summaryResult = await db
    .select({
      totalPoints: sql<number>`COALESCE(SUM(${leaderboard.finalPoints}), 0)`.as('totalPoints'),
      totalActions: sql<number>`COALESCE(COUNT(*), 0)`.as('totalActions'),
    })
    .from(leaderboard)
    .where(and(eq(leaderboard.userId, userId), timeCondition))

  return {
    contributions,
    summary: summaryResult[0] || { totalPoints: 0, totalActions: 0 },
    total
  }
}

/**
 * Get user's rank in the leaderboard
 */
export async function getUserRank(userId: string, timeFilter?: '24h' | '7d' | '30d' | 'all') {
  let timeCondition = sql`1 = 1`
  if (timeFilter && timeFilter !== 'all') {
    const now = new Date()
    let cutoffDate: Date;
    switch (timeFilter) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }
    timeCondition = gte(leaderboard.createdAt, cutoffDate!)
  }

  const rankedUsers = db
    .select({
      userId: leaderboard.userId,
      rank: sql<number>`RANK() OVER (ORDER BY SUM(${leaderboard.finalPoints}) DESC)`.as('rank'),
    })
    .from(leaderboard)
    .where(timeCondition)
    .groupBy(leaderboard.userId)
    .as('ranked_users');

  const userRankResult = await db
    .select({ rank: rankedUsers.rank })
    .from(rankedUsers)
    .where(eq(rankedUsers.userId, userId));

  if (userRankResult.length === 0) {
    return null;
  }

  return userRankResult[0].rank;
} 