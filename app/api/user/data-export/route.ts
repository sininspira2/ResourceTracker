import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserIdentifier } from '@/lib/auth'
import { db, resourceHistory, resources } from '@/lib/db'
import { eq, desc, or } from 'drizzle-orm'
import { hasResourceAccess } from '@/lib/discord-roles'

// GET /api/user/data-export - Export all user data (GDPR compliance)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = getUserIdentifier(session)

    // For backward compatibility, also check for old user identifiers
    const oldUserIds = [
      session.user.id,
      session.user.email, 
      session.user.name,
      'unknown'
    ].filter(Boolean)

    // Fetch all user activity (current and legacy identifiers)
    const activity = await db
      .select({
        id: resourceHistory.id,
        resourceId: resourceHistory.resourceId,
        resourceName: resources.name,
        previousQuantity: resourceHistory.previousQuantity,
        newQuantity: resourceHistory.newQuantity,
        changeAmount: resourceHistory.changeAmount,
        changeType: resourceHistory.changeType,
        reason: resourceHistory.reason,
        createdAt: resourceHistory.createdAt,
      })
      .from(resourceHistory)
      .innerJoin(resources, eq(resourceHistory.resourceId, resources.id))
      .where(
        or(
          eq(resourceHistory.updatedBy, userId),
          ...oldUserIds.map(id => eq(resourceHistory.updatedBy, id as string))
        )
      )
      .orderBy(desc(resourceHistory.createdAt))

    // Prepare complete data export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        discordNickname: session.user.discordNickname,
        roles: session.user.roles,
        isInGuild: session.user.isInGuild,
        currentIdentifier: userId,
      },
      resourceActivity: activity,
      summary: {
        totalChanges: activity.length,
        firstActivity: activity.length > 0 ? activity[activity.length - 1].createdAt : null,
        lastActivity: activity.length > 0 ? activity[0].createdAt : null,
        totalAdditions: activity.filter(a => a.changeAmount > 0).length,
        totalRemovals: activity.filter(a => a.changeAmount < 0).length,
        totalAbsoluteChanges: activity.filter(a => a.changeType === 'absolute').length,
        totalRelativeChanges: activity.filter(a => a.changeType === 'relative').length,
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
        'Content-Disposition': `attachment; filename="silver-portal-data-${userId}-${new Date().toISOString().split('T')[0]}.json"`,
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