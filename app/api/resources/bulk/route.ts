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
import { getLocationNames } from "@/lib/global-settings";

// Formula injection prevention: prefix values that would be interpreted as
// spreadsheet formulas (=, +, -, @, tab, carriage-return) with a single quote.
// This follows the OWASP recommendation for CSV injection mitigation.
const CSV_INJECTION_RE = /^[=+\-@\t\r]/;

/**
 * Sanitizes a string value for safe inclusion in a CSV file.
 *
 * Prefixes values that start with formula-injection characters (`=`, `+`, `-`,
 * `@`, tab, carriage-return) with a single quote, following the OWASP
 * recommendation for CSV injection mitigation.
 *
 * @param value - The raw string value to sanitize
 * @returns The sanitized string, safe for CSV output
 */
function sanitizeCsvField(value: string): string {
  return CSV_INJECTION_RE.test(value) ? `'${value}` : value;
}

/**
 * Reverses the CSV injection prefix added by {@link sanitizeCsvField}.
 *
 * Some CSV editors (e.g. LibreOffice, plain-text editors) preserve the leading
 * single-quote verbatim when re-saving; Excel treats it as a text-prefix marker
 * and drops it. Stripping on import keeps both round-trip paths correct.
 *
 * Accepts `unknown` because PapaParse row fields can be `undefined` at runtime
 * when a column is absent despite the TypeScript `CsvRow` type. Only strips the
 * leading quote when `length > 1` so a lone `"'"` is not silently collapsed to `""`.
 *
 * @param value - The raw field value from the parsed CSV row
 * @returns The desanitized string, or `""` if the value is not a string
 */
function desanitizeCsvField(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.length > 1 && value.startsWith("'") ? value.slice(1) : value;
}

/**
 * GET /api/resources/bulk
 *
 * Exports a filtered list of resources as a CSV file. The CSV contains
 * `id`, `name`, `quantityHagga`, `quantityDeepDesert`, and `targetQuantity`
 * columns. String fields are sanitized against CSV injection.
 *
 * Supports the same filter parameters as the main resource list:
 * `status`, `category`, `subcategory`, `tier`, `needsUpdate`, `priority`,
 * and `searchTerm`.
 *
 * Requires target-edit access. Returns a `text/csv` attachment.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !hasTargetEditAccess(session.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.getAll("status");
  const categoryFilter = searchParams.getAll("category");
  const subcategoryFilter = searchParams.getAll("subcategory");
  const tierFilter = searchParams.getAll("tier");
  const needsUpdateFilter = searchParams.get("needsUpdate") === "true";
  const priorityFilter = searchParams.get("priority") === "true";
  const searchTerm = searchParams.get("searchTerm");

  let whereConditions = [];

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    whereConditions.push(
      sql`lower(${resources.name}) LIKE ${`%${searchLower}%`} OR
       lower(${resources.description}) LIKE ${`%${searchLower}%`} OR
       lower(${resources.category}) LIKE ${`%${searchLower}%`}`,
    );
  }

  if (categoryFilter.length > 0) {
    whereConditions.push(inArray(resources.category, categoryFilter));
  }

  if (subcategoryFilter.length > 0) {
    const hasNone = subcategoryFilter.includes("None");
    const otherSubcategories = subcategoryFilter.filter((s) => s !== "None");

    const subcategoryConditions = [];
    if (otherSubcategories.length > 0) {
      subcategoryConditions.push(
        inArray(resources.subcategory, otherSubcategories),
      );
    }
    if (hasNone) {
      // The frontend treats null subcategories as "None" for filtering.
      // So if "None" is in the filter, we should include resources where subcategory is null.
      subcategoryConditions.push(sql`${resources.subcategory} IS NULL`);
    }

    if (subcategoryConditions.length > 0) {
      whereConditions.push(or(...subcategoryConditions));
    }
  }

  if (tierFilter.length > 0) {
    const hasNone = tierFilter.includes("none");
    const numericTiers = tierFilter
      .map((t) => parseInt(t, 10))
      .filter((t) => !isNaN(t) && t.toString() !== "none");

    const tierConditions = [];
    if (numericTiers.length > 0) {
      tierConditions.push(inArray(resources.tier, numericTiers));
    }
    if (hasNone) {
      tierConditions.push(sql`${resources.tier} IS NULL`);
    }

    if (tierConditions.length > 0) {
      whereConditions.push(or(...tierConditions));
    }
  }

  if (priorityFilter) {
    whereConditions.push(sql`${resources.isPriority} = true`);
  }

  if (statusFilter.length > 0) {
    const percentage = sql`(${resources.quantityHagga} + ${resources.quantityDeepDesert}) * 100.0 / ${resources.targetQuantity}`;
    const statusConditions = statusFilter.map((status) => {
      switch (status) {
        case "critical":
          return sql`${resources.targetQuantity} > 0 AND ${percentage} < 50`;
        case "below_target":
          return sql`${resources.targetQuantity} > 0 AND ${percentage} >= 50 AND ${percentage} < 100`;
        case "at_target":
          return sql`(${resources.targetQuantity} IS NULL OR ${resources.targetQuantity} <= 0) OR (${percentage} >= 100 AND ${percentage} < 150)`;
        case "above_target":
          return sql`${resources.targetQuantity} > 0 AND ${percentage} >= 150`;
        default:
          return null;
      }
    });
    whereConditions.push(or(...statusConditions.filter((c) => c !== null)));
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

  const { location1Name, location2Name } = await getLocationNames();

  const EXPORT_RESERVED = new Set([
    "id",
    "name",
    "targetQuantity",
    "quantityHagga",
    "quantityDeepDesert",
  ]);
  if (
    EXPORT_RESERVED.has(location1Name) ||
    EXPORT_RESERVED.has(location2Name) ||
    location1Name === location2Name
  ) {
    return NextResponse.json(
      {
        error:
          "Location names are misconfigured: they must not match reserved column names (id, name, targetQuantity) or be identical to each other.",
      },
      { status: 500 },
    );
  }

  const dataForCsv = filteredResources.map((r) => ({
    id: sanitizeCsvField(r.id),
    name: sanitizeCsvField(r.name),
    [location1Name]: r.quantityHagga,
    [location2Name]: r.quantityDeepDesert,
    targetQuantity: r.targetQuantity,
  }));

  const csv = Papa.unparse(dataForCsv);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="resources.csv"`,
    },
  });
}

/**
 * POST /api/resources/bulk
 *
 * Validates a CSV file upload for bulk import. Parses the CSV (up to 256 KB),
 * checks required columns (`id`, `name`, `quantityHagga`, `quantityDeepDesert`),
 * and returns a diff array describing the status of each row:
 * - `"changed"` — values differ from the database
 * - `"unchanged"` — values match the database
 * - `"not_found"` — no resource with that ID exists
 * - `"invalid"` — one or more values failed validation
 *
 * Does **not** apply any changes; use `POST /api/resources/bulk/confirm` to commit.
 * Requires target-edit access.
 */
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
  const parsed = Papa.parse<Record<string, string>>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  const { location1Name, location2Name } = await getLocationNames();
  const presentColumns = parsed.meta.fields ?? [];

  const IMPORT_RESERVED = new Set([
    "id",
    "name",
    "quantityHagga",
    "quantityDeepDesert",
  ]);
  const loc1NameValid =
    !IMPORT_RESERVED.has(location1Name) && location1Name !== location2Name;
  const loc2NameValid =
    !IMPORT_RESERVED.has(location2Name) && location1Name !== location2Name;
  if (!loc1NameValid || !loc2NameValid) {
    return NextResponse.json(
      {
        error:
          "Location names are misconfigured: they must not match reserved column names (id, name, quantityHagga, quantityDeepDesert) or be identical to each other.",
      },
      { status: 500 },
    );
  }

  // Accept either the validated configured name or the legacy column name
  const loc1Key =
    loc1NameValid && presentColumns.includes(location1Name)
      ? location1Name
      : presentColumns.includes("quantityHagga")
        ? "quantityHagga"
        : null;
  const loc2Key =
    loc2NameValid && presentColumns.includes(location2Name)
      ? location2Name
      : presentColumns.includes("quantityDeepDesert")
        ? "quantityDeepDesert"
        : null;

  const missingColumns = [
    ...(!presentColumns.includes("id") ? ["id"] : []),
    ...(!presentColumns.includes("name") ? ["name"] : []),
    ...(!loc1Key ? [`${location1Name} or quantityHagga`] : []),
    ...(!loc2Key ? [`${location2Name} or quantityDeepDesert`] : []),
  ];
  if (missingColumns.length > 0) {
    return NextResponse.json(
      {
        error: `CSV is missing required columns: ${missingColumns.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const ids = parsed.data
    .map((row) => desanitizeCsvField(row.id))
    .filter(Boolean);
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
    const rowId = desanitizeCsvField(row.id);
    const rowName = desanitizeCsvField(row.name);
    const current = currentResourcesMap.get(rowId);
    if (!current) {
      return { id: rowId, name: rowName, status: "not_found" };
    }

    const newValues: any = {};
    const validationErrors: any = {};

    const validateAndSet = (
      value: unknown,
      internalField: "quantityHagga" | "quantityDeepDesert",
    ) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        validationErrors[internalField] = "Must be a positive integer";
      } else {
        newValues[internalField] = num;
      }
    };

    validateAndSet(desanitizeCsvField(row[loc1Key!]), "quantityHagga");
    validateAndSet(desanitizeCsvField(row[loc2Key!]), "quantityDeepDesert");

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
        id: rowId,
        name: current.name,
        status: "invalid",
        errors: validationErrors,
        old: {
          quantityHagga: current.quantityHagga,
          quantityDeepDesert: current.quantityDeepDesert,
          targetQuantity: current.targetQuantity,
        },
        new: {
          quantityHagga: desanitizeCsvField(row[loc1Key!]),
          quantityDeepDesert: desanitizeCsvField(row[loc2Key!]),
          targetQuantity: desanitizeCsvField(row.targetQuantity),
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
        id: rowId,
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
      return { id: rowId, name: current.name, status: "unchanged" };
    }
  });

  return NextResponse.json(diff);
}
