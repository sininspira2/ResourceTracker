import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { resourceHistory } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

import { hasResourceAdminAccess } from '@/lib/discord-roles'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = session.user.roles || []
    if (!hasResourceAdminAccess(userRoles)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: resourceId, entryId } = await params

    // Verify the entry exists and belongs to this resource
    const existingEntry = await db
      .select()
      .from(resourceHistory)
      .where(and(
        eq(resourceHistory.id, entryId),
        eq(resourceHistory.resourceId, resourceId)
      ))
      .limit(1)

    if (existingEntry.length === 0) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 })
    }

    // Delete the history entry
    await db
      .delete(resourceHistory)
      .where(and(
        eq(resourceHistory.id, entryId),
        eq(resourceHistory.resourceId, resourceId)
      ))

    return NextResponse.json({ 
      success: true,
      message: 'History entry deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting history entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 