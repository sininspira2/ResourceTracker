import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLeaderboard } from '@/lib/leaderboard'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const internalUrl = new URL(`/api/internal/leaderboard`, request.url)
  internalUrl.search = request.nextUrl.search;

  const response = await fetch(internalUrl, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
} 