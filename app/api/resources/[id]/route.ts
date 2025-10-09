import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceHistory, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hasResourceAccess, hasResourceAdminAccess } from "@/lib/discord-roles";
import { awardPoints } from "@/lib/leaderboard";

// Calculate status based on quantity vs target
const calculateResourceStatus = (
  quantity: number,
  targetQuantity: number | null,
): "above_target" | "at_target" | "below_target" | "critical" => {
  if (!targetQuantity || targetQuantity <= 0) return "at_target";

  const percentage = (quantity / targetQuantity) * 100;
  if (percentage >= 150) return "above_target"; // Purple - well above target
  if (percentage >= 100) return "at_target"; // Green - at or above target
  if (percentage >= 50) return "below_target"; // Orange - below target but not critical
  return "critical"; // Red - very much below target
};

// Import role-checking functions from discord-roles.ts
import { hasTargetEditAccess } from "@/lib/discord-roles";

// PUT /api/resources/[id] - Update single resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !hasResourceAccess(session.user.roles)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    let {
      quantity,
      updateType = "absolute",
      changeValue,
      reason,
      quantityField,
      onBehalfOf,
    } = await request.json();
    const actingUserIdentifier = getUserIdentifier(session);

    let effectiveUserId = actingUserIdentifier;

    // If an admin is acting on behalf of another user, look up that user's display name
    if (onBehalfOf && hasResourceAdminAccess(session.user.roles)) {
      const targetUser = await db
        .select({
          username: users.username,
          customNickname: users.customNickname,
        })
        .from(users)
        .where(eq(users.id, onBehalfOf));

      if (targetUser.length === 0) {
        return NextResponse.json(
          { error: "User to act on behalf of not found" },
          { status: 404 },
        );
      }

      // Use the display name for consistency in history and leaderboards
      effectiveUserId = targetUser[0].customNickname || targetUser[0].username;

      // Append an audit note to the reason
      const auditNote = `(entered by ${actingUserIdentifier})`;
      reason = reason ? `${reason} ${auditNote}` : auditNote;
    }

    const result = await db.transaction(async (tx) => {
      // Get current resource for history logging and points calculation
      const currentResource = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id));
      if (currentResource.length === 0) {
        throw new Error("ResourceNotFound");
      }

      const resource = currentResource[0];
      let previousQuantityHagga = resource.quantityHagga;
      let newQuantityHagga = resource.quantityHagga;
      let changeAmountHagga = 0;
      let previousQuantityDeepDesert = resource.quantityDeepDesert;
      let newQuantityDeepDesert = resource.quantityDeepDesert;
      let changeAmountDeepDesert = 0;

      if (quantityField === "quantityDeepDesert") {
        changeAmountDeepDesert =
          updateType === "relative"
            ? changeValue
            : quantity - previousQuantityDeepDesert;
        newQuantityDeepDesert =
          previousQuantityDeepDesert + changeAmountDeepDesert;
      } else {
        // default to hagga
        changeAmountHagga =
          updateType === "relative"
            ? changeValue
            : quantity - previousQuantityHagga;
        newQuantityHagga = previousQuantityHagga + changeAmountHagga;
      }

      // Update the resource
      await tx
        .update(resources)
        .set({
          quantityHagga: newQuantityHagga,
          quantityDeepDesert: newQuantityDeepDesert,
          lastUpdatedBy: actingUserIdentifier, // Always log the admin who performed the action
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id));

      // Log the change in history
      await tx.insert(resourceHistory).values({
        id: nanoid(),
        resourceId: id,
        previousQuantityHagga,
        newQuantityHagga,
        changeAmountHagga,
        previousQuantityDeepDesert,
        newQuantityDeepDesert,
        changeAmountDeepDesert,
        changeType: updateType || "absolute",
        updatedBy: effectiveUserId, // This is the user the action is for
        reason: reason,
        createdAt: new Date(),
      });

      // Award points if quantity changed
      const totalChangeAmount = changeAmountHagga + changeAmountDeepDesert;
      let pointsCalculation = null;
      if (totalChangeAmount !== 0) {
        const actionType: "ADD" | "SET" | "REMOVE" =
          updateType === "absolute"
            ? "SET"
            : totalChangeAmount > 0
              ? "ADD"
              : "REMOVE";

        const resourceStatus = calculateResourceStatus(
          resource.quantityHagga + resource.quantityDeepDesert,
          resource.targetQuantity,
        );

        pointsCalculation = await awardPoints(
          effectiveUserId, // Award points to the user the action is for
          id,
          actionType,
          Math.abs(totalChangeAmount),
          {
            name: resource.name,
            category: resource.category || "Other",
            status: resourceStatus,
            multiplier: resource.multiplier || 1.0,
          },
          tx, // Pass the transaction object
        );
      }

      const updatedResource = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id));

      return {
        resource: updatedResource[0],
        pointsEarned: pointsCalculation?.finalPoints || 0,
        pointsCalculation,
      };
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    if (error.message === "ResourceNotFound") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}

// DELETE /api/resources/[id] - Delete resource and all its history (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !hasResourceAdminAccess(session.user.roles)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    await db.transaction(async (tx) => {
      const resource = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id));
      if (resource.length === 0) {
        throw new Error("ResourceNotFound");
      }

      await tx
        .delete(resourceHistory)
        .where(eq(resourceHistory.resourceId, id));
      await tx.delete(resources).where(eq(resources.id, id));
    });

    return NextResponse.json(
      { message: "Resource and its history deleted successfully" },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error: any) {
    if (error.message === "ResourceNotFound") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}
