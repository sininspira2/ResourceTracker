import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db, resources, resourceHistory } from "@/lib/db";
import { canEditTargets } from "@/lib/discord-roles";
import { inArray, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdentifier(session);

  if (!session || !canEditTargets(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      for (const update of updates) {
        if (update.status !== "changed") continue;

        const currentResource = await tx.select().from(resources).where(eq(resources.id, update.id)).limit(1);
        if(currentResource.length === 0) continue;
        const current = currentResource[0];

        await tx.update(resources).set({
          quantityHagga: update.new.quantityHagga,
          quantityDeepDesert: update.new.quantityDeepDesert,
          targetQuantity: update.new.targetQuantity,
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        }).where(eq(resources.id, update.id));

        await tx.insert(resourceHistory).values({
          id: nanoid(),
          resourceId: update.id,
          previousQuantityHagga: current.quantityHagga,
          newQuantityHagga: update.new.quantityHagga,
          changeAmountHagga: update.new.quantityHagga - current.quantityHagga,
          previousQuantityDeepDesert: current.quantityDeepDesert,
          newQuantityDeepDesert: update.new.quantityDeepDesert,
          changeAmountDeepDesert: update.new.quantityDeepDesert - current.quantityDeepDesert,
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
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 });
  }
}
