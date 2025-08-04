import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserIdentifier } from '@/lib/auth'
import { db, resourceHistory } from '@/lib/db'
import { eq, or } from 'drizzle-orm'
import { hasResourceAccess } from '@/lib/discord-roles'

// POST /api/user/data-deletion - Request deletion of user data (GDPR compliance)
export async function POST(request: NextRequest) {
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

    // For GDPR compliance, we should:
    // 1. Anonymize or delete the user's resource history
    // 2. Log the deletion request for audit purposes
    // 3. Preserve aggregated/anonymized statistics if needed for legitimate interests

    // Count records before deletion for logging (all identifiers)
    const recordCount = await db
      .select()
      .from(resourceHistory)
      .where(
        or(
          eq(resourceHistory.updatedBy, userId),
          ...oldUserIds.map(id => eq(resourceHistory.updatedBy, id as string))
        )
      )

    // Option 1: Complete deletion (uncomment if preferred)
    // await db.delete(resourceHistory).where(
    //   or(
    //     eq(resourceHistory.updatedBy, userId),
    //     ...oldUserIds.map(id => eq(resourceHistory.updatedBy, id as string))
    //   )
    // )

    // Option 2: Anonymization (preserves statistics while protecting privacy)
    // This replaces the user identifier with an anonymized version
    const anonymizedId = `deleted-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await db
      .update(resourceHistory)
      .set({ 
        updatedBy: anonymizedId,
        // Optionally remove any PII from reason field
        reason: null 
      })
      .where(
        or(
          eq(resourceHistory.updatedBy, userId),
          ...oldUserIds.map(id => eq(resourceHistory.updatedBy, id as string))
        )
      )

    // Log the deletion request (this should be kept for audit/compliance purposes)
    console.log(`GDPR Deletion Request: User ${userId} (with legacy IDs: ${oldUserIds.join(', ')}) requested data deletion. ${recordCount.length} records anonymized on ${new Date().toISOString()}`)

    return NextResponse.json({
      message: 'Data deletion request processed successfully',
      recordsAffected: recordCount.length,
      method: 'anonymization', // or 'deletion' if using option 1
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error processing data deletion request:', error)
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 })
  }
} 