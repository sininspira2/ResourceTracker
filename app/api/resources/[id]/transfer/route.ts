import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceHistory } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hasResourceAccess } from "@/lib/discord-roles";
import { mapResourceRowForRead } from "@/lib/resource-mapping";

/**
 * PUT /api/resources/[id]/transfer
 *
 * Transfers a quantity of a resource between the two inventory locations.
 * Accepts either the legacy direction strings or their location-agnostic
 * equivalents:
 * - `"to_deep_desert"` / `"transfer_to_location_2"` — moves units from
 *   location 1 (legacy: Hagga) → location 2 (legacy: Deep Desert)
 * - `"to_hagga"` / `"transfer_to_location_1"` — moves units from location 2 →
 *   location 1
 *
 * History entries are written using the new `transfer_to_location_{1,2}`
 * direction strings.
 *
 * Validates that the source location has sufficient stock, then atomically
 * updates both quantities and logs the transfer in resource history.
 *
 * Requires resource access. Returns the updated resource.
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
    const { transferAmount, transferDirection } = await request.json();
    const userId = getUserIdentifier(session);

    if (typeof transferAmount !== 'number' || !Number.isInteger(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ error: "transferAmount must be a positive integer" }, { status: 400 });
    }

    if (!transferDirection) {
      return NextResponse.json(
        { error: "transferAmount and transferDirection are required" },
        { status: 400 },
      );
    }

    const TO_LOCATION_2_DIRECTIONS = new Set([
      "to_deep_desert",
      "transfer_to_location_2",
    ]);
    const TO_LOCATION_1_DIRECTIONS = new Set([
      "to_hagga",
      "transfer_to_location_1",
    ]);

    const isToLocation2 = TO_LOCATION_2_DIRECTIONS.has(transferDirection);
    const isToLocation1 = TO_LOCATION_1_DIRECTIONS.has(transferDirection);

    if (!isToLocation1 && !isToLocation2) {
      return NextResponse.json(
        { error: "Invalid transferDirection" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const currentResource = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id));
      if (currentResource.length === 0) {
        throw new Error("ResourceNotFound");
      }

      const resource = currentResource[0];
      let newQuantityHagga = resource.quantityHagga;
      let newQuantityDeepDesert = resource.quantityDeepDesert;

      if (isToLocation2) {
        if (resource.quantityHagga < transferAmount) {
          throw new Error("Insufficient quantity in Hagga base");
        }
        newQuantityHagga = resource.quantityHagga - transferAmount;
        newQuantityDeepDesert = resource.quantityDeepDesert + transferAmount;
      } else {
        if (resource.quantityDeepDesert < transferAmount) {
          throw new Error("Insufficient quantity in Deep Desert base");
        }
        newQuantityHagga = resource.quantityHagga + transferAmount;
        newQuantityDeepDesert = resource.quantityDeepDesert - transferAmount;
      }

      await tx
        .update(resources)
        .set({
          quantityHagga: newQuantityHagga,
          quantityDeepDesert: newQuantityDeepDesert,
          quantityLocation1: newQuantityHagga,
          quantityLocation2: newQuantityDeepDesert,
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id));

      const changeAmountHagga = isToLocation1 ? transferAmount : -transferAmount;
      const changeAmountDeepDesert = isToLocation2
        ? transferAmount
        : -transferAmount;
      const newTransferDirection = isToLocation2
        ? "transfer_to_location_2"
        : "transfer_to_location_1";

      await tx.insert(resourceHistory).values({
        id: nanoid(),
        resourceId: id,
        previousQuantityHagga: resource.quantityHagga,
        newQuantityHagga: newQuantityHagga,
        changeAmountHagga,
        previousQuantityDeepDesert: resource.quantityDeepDesert,
        newQuantityDeepDesert: newQuantityDeepDesert,
        changeAmountDeepDesert,
        previousQuantityLocation1: resource.quantityHagga,
        newQuantityLocation1: newQuantityHagga,
        changeAmountLocation1: changeAmountHagga,
        previousQuantityLocation2: resource.quantityDeepDesert,
        newQuantityLocation2: newQuantityDeepDesert,
        changeAmountLocation2: changeAmountDeepDesert,
        changeType: "transfer",
        updatedBy: userId,
        reason: `Transfer ${transferAmount} ${newTransferDirection}`,
        createdAt: new Date(),
        transferAmount: transferAmount,
        transferDirection: newTransferDirection,
      });

      const updatedResource = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id));
      return {
        resource: updatedResource[0]
          ? mapResourceRowForRead(updatedResource[0])
          : updatedResource[0],
      };
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.startsWith("Insufficient quantity")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    if (errorMessage === "ResourceNotFound") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }
    console.error("Error transferring resource quantity:", error);
    return NextResponse.json(
      { error: "Failed to transfer resource quantity" },
      { status: 500 },
    );
  }
}
