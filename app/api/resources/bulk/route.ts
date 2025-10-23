import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, resources } from "@/lib/db";
import { hasTargetEditAccess } from "@/lib/discord-roles";
import { inArray } from "drizzle-orm";
import Papa from "papaparse";
import { getResources } from "@/lib/resource-queries";

interface CsvRow {
  id: string;
  name: string;
  quantityHagga: string;
  quantityDeepDesert: string;
  targetQuantity: string;
}

// Define more specific types to replace 'any'
type NewValues = {
  quantityHagga?: number;
  quantityDeepDesert?: number;
  targetQuantity?: number | null;
};

type ValidationErrors = {
  quantityHagga?: string;
  quantityDeepDesert?: string;
  targetQuantity?: string;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filteredResources = await getResources({
    status: searchParams.get("status"),
    category: searchParams.get("category"),
    needsUpdate: searchParams.get("needsUpdate") === "true",
    priority: searchParams.get("priority") === "true",
    searchTerm: searchParams.get("searchTerm"),
  });

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

    const newValues: NewValues = {};
    const validationErrors: ValidationErrors = {};

    const validateAndSet = (
      value: string,
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
