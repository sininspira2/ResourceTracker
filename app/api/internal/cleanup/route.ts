import { NextRequest, NextResponse } from "next/server";
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
 * Secured via `CRON_SECRET` as recommended by Vercel for cron routes:
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 *
 * Intended to be invoked by the Vercel Cron scheduler only.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("Authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use millisecond arithmetic to avoid setMonth() edge cases where the
    // current day doesn't exist in the target month (e.g. Aug 31 → March 2).
    const cutoff = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

    await db.delete(resourceHistory).where(lt(resourceHistory.createdAt, cutoff));

    console.log(
      `[cleanup] Pruned resource_history entries older than ${cutoff.toISOString()}`,
    );

    return NextResponse.json({ cutoff: cutoff.toISOString() });
  } catch (error) {
    console.error("[cleanup] Failed to prune resource history:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
