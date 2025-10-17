import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db, resources } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hasResourceAccess, hasTargetEditAccess } from "@/lib/discord-roles";

// PUT /api/resources/[id]/target - Update target quantity (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for admin role
  if (!hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json(
      { error: "Insufficient permissions - admin access required" },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const { targetQuantity } = await request.json();
    const userId = getUserIdentifier(session);

    // Validate target quantity
    if (targetQuantity < 0) {
      return NextResponse.json(
        { error: "Target quantity cannot be negative" },
        { status: 400 },
      );
    }

    // Check if resource exists
    const currentResource = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));
    if (currentResource.length === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Update the resource target quantity only (status is calculated client-side)
    await db
      .update(resources)
      .set({
        targetQuantity: targetQuantity,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, id));

    // Get the updated resource
    const updatedResource = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));

    return NextResponse.json(updatedResource[0], {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error updating target quantity:", error);
    return NextResponse.json(
      { error: "Failed to update target quantity" },
      { status: 500 },
    );
  }
}
