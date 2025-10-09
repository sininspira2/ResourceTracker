// /app/api/internal/resources/route.ts

import { NextResponse } from 'next/server'
import { db, resources } from '@/lib/db'

export async function GET() {
  try {
    const allResources = await db.select().from(resources)
    return NextResponse.json(allResources, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}