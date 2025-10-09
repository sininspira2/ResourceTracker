import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasResourceAccess } from '@/lib/discord-roles'

// GET /api/resources/[id]/history?days=7 - Get resource history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') || '7'

  const internalUrl = new URL(`/api/internal/resources/${params.id}/history`, request.url)
  internalUrl.searchParams.set('days', days)

  const response = await fetch(internalUrl, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch resource history' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
} 