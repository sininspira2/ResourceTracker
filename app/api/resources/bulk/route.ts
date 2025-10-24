import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, resources } from "@/lib/db";
import { hasTargetEditAccess } from "@/lib/discord-roles";
import { sql, and, inArray, or, eq, lt } from "drizzle-orm";
import Papa from "papaparse";
import {
  UPDATE_THRESHOLD_NON_PRIORITY_MS,
  UPDATE_THRESHOLD_PRIORITY_MS,
} from "@/lib/constants";

interface CsvRow {
  id: string;
  name: string;
  quantityHagga: string;
  quantityDeepDesert: string;
  targetQuantity: string;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const categoryFilter = searchParams.get("category");
  const needsUpdateFilter = searchParams.get("needsUpdate") === "true";
  const priorityFilter = searchParams.get("priority") === "true";
  const searchTerm = searchParams.get("searchTerm");
  const tierFilter = searchParams.getAll("tier");

  let whereConditions = [];

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    whereConditions.push(
      sql`lower(${resources.name}) LIKE ${`%${searchLower}%`} OR
       lower(${resources.description}) LIKE ${`%${searchLower}%`} OR
       lower(${resources.category}) LIKE ${`%${searchLower}%`}`,
    );
  }

  if (categoryFilter && categoryFilter !== "all") {
    whereConditions.push(sql`${resources.category} = ${categoryFilter}`);
  }

  if (priorityFilter) {
    whereConditions.push(sql`${resources.isPriority} = true`);
  }

  if (tierFilter.length > 0) {
    whereConditions.push(
      inArray(
        resources.tier,
        tierFilter.map((t) => Number(t)),
      ),
    );
  }

  if (statusFilter && statusFilter !== "all") {
    const percentage = sql`(${resources.quantityHagga} + ${resources.quantityDeepDesert}) * 100.0 / ${resources.targetQuantity}`;
    switch (statusFilter) {
      case "critical":
        whereConditions.push(
          sql`${resources.targetQuantity} > 0 AND ${percentage} < 50`,
        );
        break;
      case "below_target":
        whereConditions.push(
          sql`${resources.targetQuantity} > 0 AND ${percentage} >= 50 AND ${percentage} < 100`,
        );
        break;
      case "at_target":
        whereConditions.push(
          sql`(${resources.targetQuantity} IS NULL OR ${resources.targetQuantity} <= 0) OR (${percentage} >= 100 AND ${percentage} < 150)`,
        );
        break;
      case "above_target":
        whereConditions.push(
          sql`${resources.targetQuantity} > 0 AND ${percentage} >= 150`,
        );
        break;
    }
  }

  if (needsUpdateFilter) {
    const now = new Date();
    const priorityThreshold = new Date(
      now.getTime() - UPDATE_THRESHOLD_PRIORITY_MS,
    );
    const nonPriorityThreshold = new Date(
      now.getTime() - UPDATE_THRESHOLD_NON_PRIORITY_MS,
    );

    const needsUpdateCondition = or(
      and(
        eq(resources.isPriority, true),
        lt(resources.updatedAt, priorityThreshold),
      ),
      and(
        eq(resources.isPriority, false),
        lt(resources.updatedAt, nonPriorityThreshold),
      ),
    );
    whereConditions.push(needsUpdateCondition);
  }

  const query = db
    .select()
    .from(resources)
    .where(and(...whereConditions));
  const filteredResources = await query;

  const dataForCsv = filteredResources.map((r) => ({
    id: r.id,
    name: r.name,
    quantityHagga: r.quantityHagga,
    quantityDeepDesert: r.quantityDeepDesert,
    targetQuantity: r.targetQuantity,
  }));

  const csv = Papa.unparse(dataForCsv);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="resources.csv"`,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Server-side validation
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      { error: "Invalid file type. Please upload a .csv file." },
      { status: 400 },
    );
  }

  const fileSizeKiloBytes = file.size / 1024;
  if (fileSizeKiloBytes > 256) {
    return NextResponse.json(
      { error: "File size exceeds the 256KB limit." },
      { status: 400 },
    );
  }

  const csvData = await file.text();
  const parsed = Papa.parse<CsvRow>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  const ids = parsed.data.map((row) => row.id).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No valid data found in CSV" },
      { status: 400 },
    );
  }

  const currentResources = await db
    .select()
    .from(resources)
    .where(inArray(resources.id, ids));
  const currentResourcesMap = new Map(currentResources.map((r) => [r.id, r]));

  const diff = parsed.data.map((row) => {
    const current = currentResourcesMap.get(row.id);
    if (!current) {
      return { id: row.id, name: row.name, status: "not_found" };
    }

    const newValues: any = {};
    const validationErrors: any = {};

    const validateAndSet = (
      value: any,
      fieldName: "quantityHagga" | "quantityDeepDesert",
    ) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        validationErrors[fieldName] = "Must be a positive integer";
      } else {
        newValues[fieldName] = num;
      }
    };

    validateAndSet(row.quantityHagga, "quantityHagga");
    validateAndSet(row.quantityDeepDesert, "quantityDeepDesert");

    // Validate targetQuantity
    const newTargetRaw = row.targetQuantity;
    const newTarget =
      newTargetRaw === null || newTargetRaw === "" || newTargetRaw === undefined
        ? null
        : Number(newTargetRaw);
    if (
      newTarget !== null &&
      (isNaN(newTarget) || newTarget < 0 || !Number.isInteger(newTarget))
    ) {
      validationErrors.targetQuantity = "Must be a positive integer or empty";
    } else {
      newValues.targetQuantity = newTarget;
    }

    if (Object.keys(validationErrors).length > 0) {
      return {
        id: row.id,
        name: current.name,
        status: "invalid",
        errors: validationErrors,
        old: {
          quantityHagga: current.quantityHagga,
          quantityDeepDesert: current.quantityDeepDesert,
          targetQuantity: current.targetQuantity,
        },
        new: {
          quantityHagga: row.quantityHagga,
          quantityDeepDesert: row.quantityDeepDesert,
          targetQuantity: row.targetQuantity,
        },
      };
    }

    const changes = {
      quantityHagga: newValues.quantityHagga !== current.quantityHagga,
      quantityDeepDesert:
        newValues.quantityDeepDesert !== current.quantityDeepDesert,
      targetQuantity: newValues.targetQuantity !== current.targetQuantity,
    };

    if (Object.values(changes).some((c) => c)) {
      return {
        id: row.id,
        name: current.name,
        status: "changed",
        old: {
          quantityHagga: current.quantityHagga,
          quantityDeepDesert: current.quantityDeepDesert,
          targetQuantity: current.targetQuantity,
        },
        new: newValues,
      };
    } else {
      return { id: row.id, name: current.name, status: "unchanged" };
    }
  });

  return NextResponse.json(diff);
}
