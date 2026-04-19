import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db, resources, resourceHistory } from "@/lib/db";
import { hasTargetEditAccess } from "@/lib/discord-roles";
import { inArray, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

interface UpdateItem {
  id: string;
  status: "changed";
  new: {
    quantityHagga: number;
    quantityDeepDesert: number;
    targetQuantity: number | null;
  };
}

/**
 * POST /api/resources/bulk/confirm
 *
 * Applies a pre-validated set of bulk resource updates produced by
 * `POST /api/resources/bulk`. Accepts an array of `UpdateItem` objects
 * (only those with `status: "changed"` are processed). De-duplicates entries
 * by resource ID and applies all changes atomically in a single transaction,
 * logging each update to resource history with the reason `"Bulk CSV import"`.
 *
 * Requires target-edit access.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = getUserIdentifier(session);
  const updates: UpdateItem[] = await request.json();

  if (!Array.isArray(updates) || updates.length > 1000) {
    return NextResponse.json({ error: "updates must be an array of at most 1000 items" }, { status: 400 });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
  }

  for (const item of updates) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !item.id ||
      !item.new ||
      typeof item.new !== "object"
    ) {
      return NextResponse.json(
        { error: "Each update must have a valid id and numeric quantities" },
        { status: 400 },
      );
    }
    const qtyHagga = Number(item.new.quantityHagga);
    const qtyDeepDesert = Number(item.new.quantityDeepDesert);
    if (
      !Number.isInteger(qtyHagga) ||
      qtyHagga < 0 ||
      !Number.isInteger(qtyDeepDesert) ||
      qtyDeepDesert < 0
    ) {
      return NextResponse.json(
        { error: "Each update must have a valid id and numeric quantities" },
        { status: 400 },
      );
    }
    const tgt = item.new.targetQuantity;
    if (tgt !== null && tgt !== undefined) {
      const targetNum = Number(tgt);
      if (!Number.isInteger(targetNum) || targetNum < 0) {
        return NextResponse.json(
          { error: "Each update must have a valid id and numeric quantities" },
          { status: 400 },
        );
      }
    }
  }

  try {
    await db.transaction(async (tx) => {
      const changedUpdates = updates.filter(
        (update) => update.status === "changed",
      );

      // De-duplicate updates to ensure only the last entry for each resource ID is processed
      const uniqueChangedUpdates = Array.from(
        changedUpdates
          .reduce((map, update) => {
            map.set(update.id, update);
            return map;
          }, new Map<string, UpdateItem>())
          .values(),
      );

      const resourceIds = uniqueChangedUpdates.map((update) => update.id);

      if (resourceIds.length === 0) {
        return;
      }

      const currentResources = await tx
        .select()
        .from(resources)
        .where(inArray(resources.id, resourceIds));

      const currentResourcesMap = new Map(
        currentResources.map((r) => [r.id, r]),
      );

      const now = new Date();
      const historyEntries: (typeof resourceHistory.$inferInsert)[] = [];

      for (const update of uniqueChangedUpdates) {
        const current = currentResourcesMap.get(update.id);
        if (!current) {
          continue;
        }

        const newQtyHagga = Number(update.new.quantityHagga);
        const newQtyDeepDesert = Number(update.new.quantityDeepDesert);
        const tgt = update.new.targetQuantity;
        const newTargetQty =
          tgt === null || tgt === undefined ? null : Number(tgt);
        const changeAmountHagga = newQtyHagga - current.quantityHagga;
        const changeAmountDeepDesert =
          newQtyDeepDesert - current.quantityDeepDesert;

        await tx
          .update(resources)
          .set({
            quantityHagga: newQtyHagga,
            quantityDeepDesert: newQtyDeepDesert,
            quantityLocation1: newQtyHagga,
            quantityLocation2: newQtyDeepDesert,
            targetQuantity: newTargetQty,
            lastUpdatedBy: userId,
            updatedAt: now,
          })
          .where(eq(resources.id, update.id));

        historyEntries.push({
          id: nanoid(),
          resourceId: update.id,
          previousQuantityHagga: current.quantityHagga,
          newQuantityHagga: newQtyHagga,
          changeAmountHagga,
          previousQuantityDeepDesert: current.quantityDeepDesert,
          newQuantityDeepDesert: newQtyDeepDesert,
          changeAmountDeepDesert,
          previousQuantityLocation1: current.quantityHagga,
          newQuantityLocation1: newQtyHagga,
          changeAmountLocation1: changeAmountHagga,
          previousQuantityLocation2: current.quantityDeepDesert,
          newQuantityLocation2: newQtyDeepDesert,
          changeAmountLocation2: changeAmountDeepDesert,
          changeType: "absolute" as const,
          updatedBy: userId,
          reason: "Bulk CSV import",
          createdAt: now,
        });
      }

      if (historyEntries.length > 0) {
        await tx.insert(resourceHistory).values(historyEntries);
      }
    });

    return NextResponse.json({ message: "Import successful" });
  } catch (error) {
    console.error("Error during bulk import:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 },
    );
  }
}
