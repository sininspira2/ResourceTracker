import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserIdentifier } from '@/lib/auth'
import { db } from '@/lib/db'
import { resources, resourceHistory } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { hasResourceAccess, hasResourceAdminAccess } from '@/lib/discord-roles'
import { awardPoints } from '@/lib/leaderboard'

// Calculate status based on quantity vs target
const calculateResourceStatus = (quantity: number, targetQuantity: number | null): 'above_target' | 'at_target' | 'below_target' | 'critical' => {
  if (!targetQuantity || targetQuantity <= 0) return 'at_target'

  const percentage = (quantity / targetQuantity) * 100
  if (percentage >= 150) return 'above_target'    // Purple - well above target
  if (percentage >= 100) return 'at_target'       // Green - at or above target
  if (percentage >= 50) return 'below_target'     // Orange - below target but not critical
  return 'critical'                               // Red - very much below target
}

// Import role-checking functions from discord-roles.ts
import { hasTargetEditAccess } from '@/lib/discord-roles'

// PUT /api/resources/[id] - Update single resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { quantity, updateType = 'absolute', changeValue, reason } = await request.json()
    const userId = getUserIdentifier(session)
    
    // Get current resource for history logging and points calculation
    const currentResource = await db.select().from(resources).where(eq(resources.id, params.id))
    if (currentResource.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    const resource = currentResource[0]
    const previousQuantity = resource.quantity
    const changeAmount = updateType === 'relative' ? changeValue : quantity - previousQuantity

    // Update the resource
    await db.update(resources)
      .set({
        quantity: quantity,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, params.id))

    // Log the change in history
    await db.insert(resourceHistory).values({
      id: nanoid(),
      resourceId: params.id,
      previousQuantity,
      newQuantity: quantity,
      changeAmount,
      changeType: updateType || 'absolute',
      updatedBy: userId,
      reason: reason,
      createdAt: new Date(),
    })

    // Award points if quantity changed
    let pointsCalculation = null
    if (changeAmount !== 0) {
      const actionType: 'ADD' | 'SET' | 'REMOVE' = 
        updateType === 'absolute' ? 'SET' :
        changeAmount > 0 ? 'ADD' : 'REMOVE'

      // Calculate the current status for bonus calculation
      const resourceStatus = calculateResourceStatus(resource.quantity, resource.targetQuantity)

      pointsCalculation = await awardPoints(
        getUserIdentifier(session),
        params.id,
        actionType,
        Math.abs(changeAmount),
        {
          name: resource.name,
          category: resource.category || 'Other',
          status: resourceStatus,
          multiplier: resource.multiplier || 1.0
        }
      )
    }

    // Get the updated resource
    const updatedResource = await db.select().from(resources).where(eq(resources.id, params.id))
    
    return NextResponse.json({
      resource: updatedResource[0],
      pointsEarned: pointsCalculation?.finalPoints || 0,
      pointsCalculation
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
} 

// DELETE /api/resources/[id] - Delete resource and all its history (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !hasResourceAdminAccess(session.user.roles)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Check if resource exists
    const resource = await db.select().from(resources).where(eq(resources.id, params.id))
    if (resource.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Delete all history entries for this resource first (due to foreign key constraint)
    await db.delete(resourceHistory).where(eq(resourceHistory.resourceId, params.id))
    
    // Delete the resource
    await db.delete(resources).where(eq(resources.id, params.id))

    return NextResponse.json({ message: 'Resource and its history deleted successfully' }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
} 