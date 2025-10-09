import { NextRequest, NextResponse } from 'next/server'
import { db, resourceHistory } from '@/lib/db'
import { eq, gte, desc, and } from 'drizzle-orm'

// GET /api/internal/resources/[id]/history?days=7 - Get resource history (internal)
export async function GET(
  request: NextRequest
) {
  try {
    // For app/api routes, dynamic parameters are found in the URL.
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    // Expected path: /api/internal/resources/[id]/history
    // The 'id' will be the 4th segment from the end.
    const resourceId = pathSegments[pathSegments.length - 2];

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is missing' }, { status: 400 });
    }

    const { searchParams } = url;
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date threshold
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Fetch history from database
    const history = await db
      .select()
      .from(resourceHistory)
      .where(
        and(
          eq(resourceHistory.resourceId, resourceId),
          gte(resourceHistory.createdAt, daysAgo)
        )
      )
      .orderBy(desc(resourceHistory.createdAt))
      .limit(100); // Limit to reduce load

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching resource history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}