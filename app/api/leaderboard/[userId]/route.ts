import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserContributions, getUserRank } from '@/lib/leaderboard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get('timeFilter') as '24h' | '7d' | '30d' | 'all' || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize
    const effectiveLimit = searchParams.get('limit') ? limit : pageSize

    const [contributions, rank] = await Promise.all([
      getUserContributions(userId, timeFilter, effectiveLimit, offset),
      getUserRank(userId, timeFilter)
    ])

    return NextResponse.json({
      userId: userId,
      timeFilter,
      rank,
      contributions: contributions.contributions,
      summary: contributions.summary,
      total: contributions.total,
      page,
      pageSize: effectiveLimit,
      totalPages: Math.ceil(contributions.total / effectiveLimit),
      hasNextPage: offset + effectiveLimit < contributions.total,
      hasPrevPage: page > 1
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching user contributions:', error)
    return NextResponse.json({ error: 'Failed to fetch user contributions' }, { status: 500 })
  }
} 