import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceHistory } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hasResourceAccess } from "@/lib/discord-roles";

/**
 * PUT /api/resources/[id]/transfer
 *
 * Transfers a quantity of a resource between the Hagga base and Deep Desert
 * storage. The transfer direction is specified by `transferDirection`:
 * - `"to_deep_desert"` — moves units from Hagga → Deep Desert
 * - `"to_hagga"` — moves units from Deep Desert → Hagga
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

    if (
      transferDirection !== "to_deep_desert" &&
      transferDirection !== "to_hagga"
    ) {
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

      if (transferDirection === "to_deep_desert") {
        if (resource.quantityHagga < transferAmount) {
          throw new Error("Insufficient quantity in Hagga base");
        }
        newQuantityHagga = resource.quantityHagga - transferAmount;
        newQuantityDeepDesert = resource.quantityDeepDesert + transferAmount;
      } else {
        // to_hagga
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
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id));

      await tx.insert(resourceHistory).values({
        id: nanoid(),
        resourceId: id,
        previousQuantityHagga: resource.quantityHagga,
        newQuantityHagga: newQuantityHagga,
        changeAmountHagga:
          transferDirection === "to_hagga" ? transferAmount : -transferAmount,
        previousQuantityDeepDesert: resource.quantityDeepDesert,
        newQuantityDeepDesert: newQuantityDeepDesert,
        changeAmountDeepDesert:
          transferDirection === "to_deep_desert"
            ? transferAmount
            : -transferAmount,
        changeType: "transfer",
        updatedBy: userId,
        reason: `Transfer ${transferAmount} ${transferDirection}`,
        createdAt: new Date(),
        transferAmount: transferAmount,
        transferDirection: transferDirection,
      });

      const updatedResource = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id));
      return { resource: updatedResource[0] };
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
