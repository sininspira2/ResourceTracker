import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, resourceHistory } from "@/lib/db";
import { eq, gte, desc, and } from "drizzle-orm";
import { hasResourceAccess } from "@/lib/discord-roles";
import { cache, CACHE_KEYS } from "@/lib/cache";

// GET /api/resources/[id]/history?days=7 - Get resource history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const { id: resourceId } = await params;

    // Remove cache check to prevent stale data on Vercel
    // const cacheKey = CACHE_KEYS.RESOURCE_HISTORY(resourceId, days)
    // const cachedHistory = cache.get(cacheKey)
    // if (cachedHistory) {
    //   return NextResponse.json(cachedHistory)
    // }

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
          gte(resourceHistory.createdAt, daysAgo),
        ),
      )
      .orderBy(desc(resourceHistory.createdAt))
      .limit(100); // Limit to reduce load

    // Return fresh data with cache-busting headers
    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching resource history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
