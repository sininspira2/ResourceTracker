import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserIdentifier } from '@/lib/auth'
import { db, resourceHistory, resources } from '@/lib/db'
import { eq, gte, desc, and, or } from 'drizzle-orm'
import { hasResourceAccess } from '@/lib/discord-roles'

// GET /api/user/activity - Get user's activity history
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = getUserIdentifier(session)
  const oldUserIds = [
    session.user.id,
    session.user.email,
    session.user.name,
    'unknown'
  ].filter(Boolean) as string[]

  const internalUrl = new URL(`/api/internal/user/activity`, request.url)
  internalUrl.search = request.nextUrl.search;
  internalUrl.searchParams.set('userId', userId);
  internalUrl.searchParams.set('oldUserIds', oldUserIds.join(','));

  const response = await fetch(internalUrl, {
    next: { revalidate: 120 }, // Cache for 2 minutes
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
} 