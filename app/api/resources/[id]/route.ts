import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceHistory, users, leaderboard } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  hasResourceAccess,
  hasResourceAdminAccess,
  hasTargetEditAccess,
} from "@/lib/discord-roles";
import { awardPoints } from "@/lib/leaderboard";
import { calculateResourceStatus } from "@/lib/resource-utils";
import {
  mapCategoryForRead,
  mapResourceRowForRead,
} from "@/lib/resource-mapping";
import { resolveDisplayNames } from "@/lib/users";

/**
 * PUT /api/resources/[id]
 *
 * Updates the quantity of a single resource (Hagga or Deep Desert field).
 * Supports both `"absolute"` (set to value) and `"relative"` (add/subtract)
 * update types. Logs the change to resource history and awards leaderboard points.
 *
 * Admins may supply `onBehalfOf` (a user ID) to attribute the change to another
 * user while still recording the acting admin in the history reason.
 *
 * Requires resource access. Returns the updated resource and points earned.
 */
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

    if (reason && typeof reason !== "string") {
      return NextResponse.json(
        { error: "reason must be a string" },
        { status: 400 },
      );
    }
    if (reason && reason.length > 500) {
      return NextResponse.json(
        { error: "Reason must be 500 characters or less" },
        { status: 400 },
      );
    }
    if (reason) {
      reason = reason.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    }

    if (
      quantityField !== undefined &&
      quantityField !== "quantityHagga" &&
      quantityField !== "quantityDeepDesert" &&
      quantityField !== "quantityLocation1" &&
      quantityField !== "quantityLocation2"
    ) {
      return NextResponse.json(
        {
          error:
            "quantityField must be 'quantityHagga', 'quantityDeepDesert', 'quantityLocation1', or 'quantityLocation2'",
        },
        { status: 400 },
      );
    }

    if (updateType === "absolute") {
      if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 0
      ) {
        return NextResponse.json(
          {
            error:
              "quantity must be a non-negative integer for absolute updates",
          },
          { status: 400 },
        );
      }
    }

    if (updateType === "relative") {
      if (
        typeof changeValue !== "number" ||
        !Number.isInteger(changeValue) ||
        changeValue === 0
      ) {
        return NextResponse.json(
          {
            error:
              "changeValue must be a non-zero integer for relative updates",
          },
          { status: 400 },
        );
      }
    }

    let effectiveUserId = actingUserIdentifier;

    // If an admin is acting on behalf of another user, look up that user's Discord ID
    if (onBehalfOf && hasResourceAdminAccess(session.user.roles)) {
      const targetUser = await db
        .select({
          discordId: users.discordId,
        })
        .from(users)
        .where(eq(users.id, onBehalfOf));

      if (targetUser.length === 0) {
        return NextResponse.json(
          { error: "User to act on behalf of not found" },
          { status: 404 },
        );
      }

      // Use the Discord ID for stable tracking — display name resolved at read time
      effectiveUserId = targetUser[0].discordId;

      // Append a human-readable audit note using the acting admin's display name.
      // Fallback to "Unknown Admin" so a raw Discord snowflake never surfaces in
      // stored history if somehow both nickname and username are absent.
      const actingDisplayName =
        session.user?.discordNickname || session.user?.name || "Unknown Admin";
      const auditNote = ` (entered by ${actingDisplayName})`;
      if (reason) {
        const maxBase = 500 - auditNote.length;
        reason =
          (reason.length > maxBase ? reason.slice(0, maxBase) : reason) +
          auditNote;
      } else {
        reason = auditNote.trimStart();
      }
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

      if (
        quantityField === "quantityDeepDesert" ||
        quantityField === "quantityLocation2"
      ) {
        changeAmountDeepDesert =
          updateType === "relative"
            ? changeValue
            : quantity - previousQuantityDeepDesert;
        newQuantityDeepDesert =
          previousQuantityDeepDesert + changeAmountDeepDesert;
        if (newQuantityDeepDesert < 0) {
          throw new Error("ValidationError:NegativeQuantity");
        }
      } else {
        // default to location 1 (legacy: hagga)
        changeAmountHagga =
          updateType === "relative"
            ? changeValue
            : quantity - previousQuantityHagga;
        newQuantityHagga = previousQuantityHagga + changeAmountHagga;
        if (newQuantityHagga < 0) {
          throw new Error("ValidationError:NegativeQuantity");
        }
      }

      // Update the resource (dual-write to legacy + location-agnostic columns)
      await tx
        .update(resources)
        .set({
          quantityHagga: newQuantityHagga,
          quantityDeepDesert: newQuantityDeepDesert,
          quantityLocation1: newQuantityHagga,
          quantityLocation2: newQuantityDeepDesert,
          lastUpdatedBy: actingUserIdentifier, // Always log the admin who performed the action
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id));

      // Log the change in history (dual-write to legacy + location-agnostic columns)
      await tx.insert(resourceHistory).values({
        id: nanoid(),
        resourceId: id,
        previousQuantityHagga,
        newQuantityHagga,
        changeAmountHagga,
        previousQuantityDeepDesert,
        newQuantityDeepDesert,
        changeAmountDeepDesert,
        previousQuantityLocation1: previousQuantityHagga,
        newQuantityLocation1: newQuantityHagga,
        changeAmountLocation1: changeAmountHagga,
        previousQuantityLocation2: previousQuantityDeepDesert,
        newQuantityLocation2: newQuantityDeepDesert,
        changeAmountLocation2: changeAmountDeepDesert,
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
          newQuantityHagga + newQuantityDeepDesert,
          resource.targetQuantity,
        );

        pointsCalculation = await awardPoints(
          effectiveUserId, // Award points to the user the action is for
          id,
          actionType,
          Math.abs(totalChangeAmount),
          {
            name: resource.name,
            category: mapCategoryForRead(resource.category) || "Other",
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
        resource: updatedResource[0]
          ? mapResourceRowForRead(updatedResource[0])
          : updatedResource[0],
        pointsEarned: pointsCalculation?.finalPoints || 0,
        pointsCalculation,
      };
    });

    if (result.resource?.lastUpdatedBy) {
      try {
        const displayNameMap = await resolveDisplayNames([
          result.resource.lastUpdatedBy,
        ]);
        result.resource = {
          ...result.resource,
          lastUpdatedBy:
            displayNameMap[result.resource.lastUpdatedBy] ||
            result.resource.lastUpdatedBy,
        };
      } catch (error) {
        console.error(
          "Failed to resolve display name for lastUpdatedBy:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "ResourceNotFound") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }
    if (errorMessage === "ValidationError:NegativeQuantity") {
      return NextResponse.json(
        { error: "Relative update would result in a negative quantity" },
        { status: 400 },
      );
    }
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/resources/[id]
 *
 * Permanently deletes a resource along with all associated history entries and
 * leaderboard records. Requires resource admin access.
 *
 * The deletion runs inside a transaction to ensure referential consistency.
 */
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
      await tx.delete(leaderboard).where(eq(leaderboard.resourceId, id));
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "ResourceNotFound") {
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
