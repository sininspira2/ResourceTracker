import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserIdentifier } from "@/lib/auth";
import { db, resources, resourceHistory } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { hasResourceAccess, hasResourceAdminAccess } from "@/lib/discord-roles";
import { nanoid } from "nanoid";
import { awardPoints } from "@/lib/leaderboard";
import { calculateResourceStatus } from "@/lib/resource-utils";
import {
  mapCategoryForRead,
  mapResourceRowForRead,
} from "@/lib/resource-mapping";

/**
 * GET /api/resources
 *
 * Proxies the request to the internal cached resources endpoint
 * (`/api/internal/resources`) and returns the result. Query parameters
 * (filters, pagination, etc.) are forwarded as-is.
 */
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

/**
 * POST /api/resources
 *
 * Creates a new resource. Requires resource admin access.
 * Inserts the resource and logs the initial quantity as a history entry
 * within a single database transaction.
 *
 * Request body: `{ name, category, subcategory?, tier?, description?, imageUrl?,
 * quantity?, quantityHagga?, quantityDeepDesert?, targetQuantity?, multiplier? }`
 */
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
      quantityLocation1,
      quantityLocation2,
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

    const rawLocation1 = quantityLocation1 ?? quantityHagga ?? quantity ?? 0;
    const rawLocation2 = quantityLocation2 ?? quantityDeepDesert ?? 0;

    if (
      typeof rawLocation1 !== "number" ||
      typeof rawLocation2 !== "number" ||
      !Number.isInteger(rawLocation1) ||
      rawLocation1 < 0 ||
      !Number.isInteger(rawLocation2) ||
      rawLocation2 < 0
    ) {
      return NextResponse.json(
        { error: "Quantities must be non-negative integers" },
        { status: 400 },
      );
    }

    const location1Qty = rawLocation1;
    const location2Qty = rawLocation2;

    const newResource = {
      id: nanoid(),
      name,
      quantityHagga: location1Qty,
      quantityDeepDesert: location2Qty,
      quantityLocation1: location1Qty,
      quantityLocation2: location2Qty,
      description: description || null,
      category,
      subcategory: subcategory || null,
      tier: tier || null,
      imageUrl: imageUrl || null,
      targetQuantity: targetQuantity || null,
      multiplier:
        typeof multiplier === "number" &&
        multiplier > 0 &&
        multiplier <= 100 &&
        Number.isFinite(multiplier)
          ? multiplier
          : 1.0,
      lastUpdatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [createdResource] = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(resources)
        .values(newResource)
        .returning();

      // Log the creation in history (dual-write to legacy + location-agnostic columns)
      await tx.insert(resourceHistory).values({
        id: nanoid(),
        resourceId: inserted[0].id,
        previousQuantityHagga: 0,
        newQuantityHagga: inserted[0].quantityHagga,
        changeAmountHagga: inserted[0].quantityHagga,
        previousQuantityDeepDesert: 0,
        newQuantityDeepDesert: inserted[0].quantityDeepDesert,
        changeAmountDeepDesert: inserted[0].quantityDeepDesert,
        previousQuantityLocation1: 0,
        newQuantityLocation1: inserted[0].quantityHagga,
        changeAmountLocation1: inserted[0].quantityHagga,
        previousQuantityLocation2: 0,
        newQuantityLocation2: inserted[0].quantityDeepDesert,
        changeAmountLocation2: inserted[0].quantityDeepDesert,
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

/**
 * PUT /api/resources
 *
 * Handles two update modes based on the request body:
 * - **`resourceMetadata`**: Updates a single resource's metadata fields (admin only).
 * - **`resourceUpdates`**: Bulk-updates Hagga quantities for multiple resources,
 *   logging history entries and awarding leaderboard points for each change.
 *
 * Requires resource access for bulk updates; admin access for metadata updates.
 */
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
          multiplier:
            typeof multiplier === "number" &&
            multiplier > 0 &&
            multiplier <= 100 &&
            Number.isFinite(multiplier)
              ? multiplier
              : 1.0,
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

      const resourceIds = resourceUpdates.map((u: { id: string }) => u.id);
      const currentResourcesList = await db
        .select()
        .from(resources)
        .where(inArray(resources.id, resourceIds));
      const currentResourcesMap = new Map(
        currentResourcesList.map((r) => [r.id, r]),
      );

      const updatePromises = resourceUpdates.map(
        async (update: {
          id: string;
          quantity: number; // This is the new total quantity for Hagga
          updateType: "absolute" | "relative";
          value: number; // This is the change amount for relative
          reason?: string;
        }) => {
          if (update.reason && update.reason.length > 500) {
            throw new Error("Reason must be 500 characters or less");
          }
          if (update.reason) {
            update.reason = update.reason
              .trim()
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
          }

          const resource = currentResourcesMap.get(update.id);
          if (!resource) return null;

          if (update.updateType === "absolute") {
            if (
              typeof update.quantity !== "number" ||
              !Number.isInteger(update.quantity) ||
              update.quantity < 0
            ) {
              throw new Error(
                `Invalid quantity for resource ${update.id}: must be a non-negative integer`,
              );
            }
          } else if (update.updateType === "relative") {
            if (
              typeof update.value !== "number" ||
              !Number.isInteger(update.value)
            ) {
              throw new Error(
                `Invalid value for resource ${update.id}: must be an integer`,
              );
            }
          }

          const previousQuantityHagga = resource.quantityHagga;
          const newQuantityHagga =
            update.updateType === "relative"
              ? previousQuantityHagga + update.value
              : update.quantity;
          if (newQuantityHagga < 0) {
            throw new Error(
              `Relative update would result in a negative quantity for resource ${update.id}`,
            );
          }
          const changeAmountHagga = newQuantityHagga - previousQuantityHagga;

          await db
            .update(resources)
            .set({
              quantityHagga: newQuantityHagga,
              quantityLocation1: newQuantityHagga,
              lastUpdatedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(resources.id, update.id));

          await db.insert(resourceHistory).values({
            id: nanoid(),
            resourceId: update.id,
            previousQuantityHagga: previousQuantityHagga,
            newQuantityHagga: newQuantityHagga,
            changeAmountHagga: changeAmountHagga,
            previousQuantityDeepDesert: resource.quantityDeepDesert,
            newQuantityDeepDesert: resource.quantityDeepDesert,
            changeAmountDeepDesert: 0,
            previousQuantityLocation1: previousQuantityHagga,
            newQuantityLocation1: newQuantityHagga,
            changeAmountLocation1: changeAmountHagga,
            previousQuantityLocation2: resource.quantityDeepDesert,
            newQuantityLocation2: resource.quantityDeepDesert,
            changeAmountLocation2: 0,
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
                category: mapCategoryForRead(resource.category) || "Other",
                status: calculateResourceStatus(
                  newQuantityHagga + resource.quantityDeepDesert,
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

      const updatedResources = await db
        .select()
        .from(resources)
        .where(inArray(resources.id, resourceIds));

      return NextResponse.json(
        {
          resources: updatedResources.map(mapResourceRowForRead),
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
