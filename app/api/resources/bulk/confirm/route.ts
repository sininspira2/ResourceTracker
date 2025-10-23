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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = getUserIdentifier(session);
  const updates: UpdateItem[] = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
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

      for (const update of uniqueChangedUpdates) {
        const current = currentResourcesMap.get(update.id);
        if (!current) {
          continue;
        }

        await tx
          .update(resources)
          .set({
            quantityHagga: update.new.quantityHagga,
            quantityDeepDesert: update.new.quantityDeepDesert,
            targetQuantity: update.new.targetQuantity,
            lastUpdatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(resources.id, update.id));

        await tx.insert(resourceHistory).values({
          id: nanoid(),
          resourceId: update.id,
          previousQuantityHagga: current.quantityHagga,
          newQuantityHagga: update.new.quantityHagga,
          changeAmountHagga: update.new.quantityHagga - current.quantityHagga,
          previousQuantityDeepDesert: current.quantityDeepDesert,
          newQuantityDeepDesert: update.new.quantityDeepDesert,
          changeAmountDeepDesert:
            update.new.quantityDeepDesert - current.quantityDeepDesert,
          changeType: "absolute",
          updatedBy: userId,
          reason: "Bulk CSV import",
          createdAt: new Date(),
        });
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
