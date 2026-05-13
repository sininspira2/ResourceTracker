import { NextResponse } from "next/server";
import { db, resourceHistory } from "@/lib/db";
import { lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/cleanup
 *
 * Deletes resource_history entries older than 6 months on a rolling basis.
 * The 6-month window is generous given that history charts only go back 3
 * months and the resource table always holds current state.
 *
 * Intended to be invoked by a Vercel Cron job. Not authenticated — only
 * callable internally via the cron scheduler (protected by Vercel's
 * infrastructure, not user-facing).
 */
export async function GET() {
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);

    const result = await db
      .delete(resourceHistory)
      .where(lt(resourceHistory.createdAt, cutoff));

    const rowsDeleted =
      (result as unknown as { rowsAffected?: number }).rowsAffected ?? 0;

    console.log(
      `[cleanup] Deleted ${rowsDeleted} resource_history entries older than ${cutoff.toISOString()}`,
    );

    return NextResponse.json({
      deleted: rowsDeleted,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("[cleanup] Failed to prune resource history:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
