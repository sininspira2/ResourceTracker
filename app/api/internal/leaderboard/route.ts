import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/leaderboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get('timeFilter') as '24h' | '7d' | '30d' | 'all' || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize
    const effectiveLimit = searchParams.get('limit') ? limit : pageSize

    const result = await getLeaderboard(timeFilter, effectiveLimit, offset)

    return NextResponse.json({
      leaderboard: result.rankings,
      timeFilter,
      total: result.total,
      page,
      pageSize: effectiveLimit,
      totalPages: Math.ceil(result.total / effectiveLimit),
      hasNextPage: offset + effectiveLimit < result.total,
      hasPrevPage: page > 1
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}