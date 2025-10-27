import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db, resources, resourceHistory } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hasResourceAccess, hasResourceAdminAccess } from "@/lib/discord-roles";
import { nanoid } from "nanoid";
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const internalUrl = new URL(
    `/api/internal/resources?${searchParams.toString()}`,
    request.nextUrl.origin,
  );
  try {
    const response = await fetch(internalUrl, {
      next: { revalidate: 1 },
      headers: {
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Internal API call failed with status ${response.status}:`,
        errorBody,
      );
      return new NextResponse(errorBody, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching from internal resources route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch resources" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// POST /api/resources - Create new resource (admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasResourceAdminAccess(session.user.roles)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const {
      name,
      category,
      subcategory,
      tier,
      description,
      imageUrl,
      quantity,
      quantityHagga,
      quantityDeepDesert,
      targetQuantity,
      multiplier,
    } = await request.json();
    const userId = getUserIdentifier(session);

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 },
      );
    }

    const haggaQty = quantityHagga || quantity || 0;
    const deepDesertQty = quantityDeepDesert || 0;

    const newResource = {
      id: nanoid(),
      name,
      quantityHagga: haggaQty,
      quantityDeepDesert: deepDesertQty,
      description: description || null,
      category,
      subcategory: subcategory || null,
      tier: tier || null,
      imageUrl: imageUrl || null,
      targetQuantity: targetQuantity || null,
      multiplier: multiplier || 1.0,
      lastUpdatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [createdResource] = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(resources)
        .values(newResource)
        .returning();

      // Log the creation in history
      await tx.insert(resourceHistory).values({
        id: nanoid(),
        resourceId: inserted[0].id,
        previousQuantityHagga: 0,
        newQuantityHagga: inserted[0].quantityHagga,
        changeAmountHagga: inserted[0].quantityHagga,
        previousQuantityDeepDesert: 0,
        newQuantityDeepDesert: inserted[0].quantityDeepDesert,
        changeAmountDeepDesert: inserted[0].quantityDeepDesert,
        changeType: "absolute",
        updatedBy: userId,
        reason: "Resource created",
        createdAt: new Date(),
      });

      return inserted;
    });

    return NextResponse.json(createdResource, {
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 },
    );
  }
}

// PUT /api/resources - Update multiple resources or single resource metadata
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserIdentifier(session);

  try {
    const body = await request.json();

    // Handle single resource metadata update (admin only)
    if (body.resourceMetadata) {
      if (!hasResourceAdminAccess(session.user.roles)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const {
        id,
        name,
        category,
        subcategory,
        description,
        imageUrl,
        multiplier,
        isPriority,
        tier,
      } = body.resourceMetadata;

      if (!id || !name || !category) {
        return NextResponse.json(
          { error: "ID, name, and category are required" },
          { status: 400 },
        );
      }

      await db
        .update(resources)
        .set({
          name,
          category,
          subcategory: subcategory || null,
          description: description || null,
          imageUrl: imageUrl || null,
          multiplier: multiplier || 1.0,
          isPriority: isPriority || false,
          tier: tier,
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(resources.id, id));

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
    }

    // Handle bulk quantity updates
    else if (body.resourceUpdates) {
      if (!hasResourceAccess(session.user.roles)) {
        return NextResponse.json(
          { error: "Resource access required" },
          { status: 403 },
        );
      }

      const { resourceUpdates } = body;
      if (!Array.isArray(resourceUpdates) || resourceUpdates.length === 0) {
        return NextResponse.json(
          { error: "Invalid resourceUpdates format" },
          { status: 400 },
        );
      }

      const updatePromises = resourceUpdates.map(
        async (update: {
          id: string;
          quantity: number; // This is the new total quantity for Hagga
          updateType: "absolute" | "relative";
          value: number; // This is the change amount for relative
          reason?: string;
        }) => {
          const currentResource = await db
            .select()
            .from(resources)
            .where(eq(resources.id, update.id));
          if (currentResource.length === 0) return null;

          const resource = currentResource[0];
          const previousQuantityHagga = resource.quantityHagga;
          const changeAmountHagga =
            update.updateType === "relative"
              ? update.value
              : update.quantity - previousQuantityHagga;

          await db
            .update(resources)
            .set({
              quantityHagga: update.quantity,
              lastUpdatedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(resources.id, update.id));

          await db.insert(resourceHistory).values({
            id: nanoid(),
            resourceId: update.id,
            previousQuantityHagga: previousQuantityHagga,
            newQuantityHagga: update.quantity,
            changeAmountHagga: changeAmountHagga,
            previousQuantityDeepDesert: resource.quantityDeepDesert,
            newQuantityDeepDesert: resource.quantityDeepDesert, // unchanged
            changeAmountDeepDesert: 0,
            changeType: update.updateType,
            updatedBy: userId,
            reason: update.reason,
            createdAt: new Date(),
          });

          let pointsCalculation = null;
          if (changeAmountHagga !== 0) {
            const actionType =
              update.updateType === "absolute"
                ? "SET"
                : changeAmountHagga > 0
                  ? "ADD"
                  : "REMOVE";
            pointsCalculation = await awardPoints(
              userId,
              update.id,
              actionType,
              Math.abs(changeAmountHagga),
              {
                name: resource.name,
                category: resource.category || "Other",
                status: calculateResourceStatus(
                  resource.quantityHagga + resource.quantityDeepDesert,
                  resource.targetQuantity,
                ),
                multiplier: resource.multiplier || 1.0,
              },
            );
          }
          return pointsCalculation;
        },
      );

      const pointsResults = await Promise.all(updatePromises);
      const totalPointsEarned = pointsResults
        .filter((result) => result !== null)
        .reduce((total, result) => total + (result?.finalPoints || 0), 0);

      const updatedResources = await db.select().from(resources);

      return NextResponse.json(
        {
          resources: updatedResources,
          totalPointsEarned,
          pointsBreakdown: pointsResults.filter((result) => result !== null),
        },
        {
          headers: {
            "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    // If neither update type is matched, it's a bad request
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error updating resources:", error);
    return NextResponse.json(
      { error: "Failed to update resources" },
      { status: 500 },
    );
  }
}
