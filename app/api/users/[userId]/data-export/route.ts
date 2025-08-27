import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserIdentifier } from '@/lib/auth'
import { db, resourceHistory, resources, users } from '@/lib/db'
import { eq, desc, or } from 'drizzle-orm'
import { hasResourceAccess } from '@/lib/discord-roles'

// GET /api/users/{userId}/data-export - Export all user data for a specific user (GDPR compliance)
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.permissions?.hasUserManagementAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId: targetUserId } = params

  try {
    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1)
    if (!targetUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = targetUser[0]

    const fakeSessionForTargetUser = {
      user: {
        id: user.id,
        name: user.username,
        discordNickname: user.customNickname,
        email: null,
        image: user.avatar,
        roles: [],
        isInGuild: false,
        permissions: session.user.permissions,
      },
      expires: session.expires,
    }
    const userIdentifier = getUserIdentifier(fakeSessionForTargetUser as any)

    // For backward compatibility, also check for old user identifiers
    const oldUserIds = [
      user.id,
      user.username,
      'unknown'
    ].filter(Boolean)

    // Fetch all user activity (current and legacy identifiers)
    const activityRaw = await db
      .select({
        id: resourceHistory.id,
        resourceId: resourceHistory.resourceId,
        resourceName: resources.name,
        previousQuantityHagga: resourceHistory.previousQuantityHagga,
        newQuantityHagga: resourceHistory.newQuantityHagga,
        changeAmountHagga: resourceHistory.changeAmountHagga,
        previousQuantityDeepDesert: resourceHistory.previousQuantityDeepDesert,
        newQuantityDeepDesert: resourceHistory.newQuantityDeepDesert,
        changeAmountDeepDesert: resourceHistory.changeAmountDeepDesert,
        changeType: resourceHistory.changeType,
        reason: resourceHistory.reason,
        createdAt: resourceHistory.createdAt,
      })
      .from(resourceHistory)
      .innerJoin(resources, eq(resourceHistory.resourceId, resources.id))
      .where(
        or(
          eq(resourceHistory.updatedBy, userIdentifier),
          ...oldUserIds.map(id => eq(resourceHistory.updatedBy, id as string))
        )
      )
      .orderBy(desc(resourceHistory.createdAt))

    const activity = activityRaw.map(entry => {
      const totalChangeAmount = (entry.changeAmountHagga || 0) + (entry.changeAmountDeepDesert || 0);
      return {
        ...entry,
        changeAmount: totalChangeAmount,
      };
    });

    // Prepare complete data export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: user.id,
        name: user.username,
        image: user.avatar,
        discordNickname: user.customNickname,
        currentIdentifier: userIdentifier,
      },
      resourceActivity: activity,
      summary: {
        totalChanges: activity.length,
        firstActivity: activity.length > 0 ? activity[activity.length - 1].createdAt : null,
        lastActivity: activity.length > 0 ? activity[0].createdAt : null,
        ...activity.reduce(
          (stats, item) => {
            if (item.changeAmount > 0) {
              stats.totalAdditions++
            } else if (item.changeAmount < 0) {
              stats.totalRemovals++
            }

            if (item.changeType === 'absolute') {
              stats.totalAbsoluteChanges++
            } else if (item.changeType === 'relative') {
              stats.totalRelativeChanges++
            }

            return stats
          },
          {
            totalAdditions: 0,
            totalRemovals: 0,
            totalAbsoluteChanges: 0,
            totalRelativeChanges: 0,
          }
        ),
      },
      dataRetention: {
        resourceActivity: 'Indefinitely (until deletion request)',
        sessionTokens: '30 days',
        discordProfile: 'Refreshed on each login',
      },
      privacyRights: {
        rightToAccess: 'This export',
        rightToRectification: 'Contact administrators',
        rightToErasure: 'Available via Privacy & Data page',
        rightToPortability: 'This JSON export',
        rightToObject: 'Contact administrators',
      }
    }

    // Return as downloadable JSON file
    const jsonData = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="resource-tracker-data-${userIdentifier}-${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json({ error: 'Failed to export user data' }, { status: 500 })
  }
}
