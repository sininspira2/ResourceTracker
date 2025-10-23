import { db, resources } from "@/lib/db";
import { sql, and, or, eq, lt, asc } from "drizzle-orm";
import {
  UPDATE_THRESHOLD_NON_PRIORITY_MS,
  UPDATE_THRESHOLD_PRIORITY_MS,
} from "@/lib/constants";

export interface ResourceFilters {
  status?: string | null;
  category?: string | null;
  needsUpdate?: boolean | null;
  priority?: boolean | null;
  searchTerm?: string | null;
}

export async function getResources(filters: ResourceFilters) {
  let whereConditions = [];
  let orderByClauses = [];

  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    whereConditions.push(
      sql`lower(${resources.name}) LIKE ${`%${searchLower}%`} OR
       lower(${resources.description}) LIKE ${`%${searchLower}%`} OR
       lower(${resources.category}) LIKE ${`%${searchLower}%`}`,
    );

    // Add ordering to prioritize more relevant results
    orderByClauses.push(
      sql`CASE
        WHEN lower(${resources.name}) = ${searchLower} THEN 1
        WHEN lower(${resources.name}) LIKE ${`${searchLower}%`} THEN 2
        WHEN lower(${resources.name}) LIKE ${`%${searchLower}%`} THEN 3
        ELSE 4
      END`,
    );
  }

  orderByClauses.push(asc(resources.name));

  if (filters.category && filters.category !== "all") {
    whereConditions.push(sql`${resources.category} = ${filters.category}`);
  }

  if (filters.priority) {
    whereConditions.push(sql`${resources.isPriority} = true`);
  }

  if (filters.status && filters.status !== "all") {
    const percentage = sql`(${resources.quantityHagga} + ${resources.quantityDeepDesert}) * 100.0 / ${resources.targetQuantity}`;
    switch (filters.status) {
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

  if (filters.needsUpdate) {
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
    .where(and(...whereConditions))
    .orderBy(...orderByClauses);

  return await query;
}
