import { NextRequest, NextResponse } from "next/server";
import { db, resourceHistory } from "@/lib/db";
import { eq, gte, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/internal/resources/[id]/history?days=7 - Get resource history (internal)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const { id: resourceId } = await params;

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

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching resource history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
