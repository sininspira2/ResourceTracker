/**
 * Helpers for normalizing resource / resource-history rows between the legacy
 * (Hagga / Deep Desert) and location-agnostic (Location1 / Location2) schemas.
 *
 * During the migration we dual-write to both sets of columns. These helpers
 * provide fallback reads so consumers always see populated location-agnostic
 * values, and translate the legacy category/direction strings to their new
 * location-agnostic equivalents.
 */

export const LEGACY_CATEGORY_BLUEPRINTS = "Blueprints";
export const NEW_CATEGORY_GEAR_BLUEPRINTS = "Gear Blueprints";

export const LEGACY_DIRECTION_TO_HAGGA = "to_hagga";
export const LEGACY_DIRECTION_TO_DEEP_DESERT = "to_deep_desert";
export const NEW_DIRECTION_TO_LOCATION_1 = "transfer_to_location_1";
export const NEW_DIRECTION_TO_LOCATION_2 = "transfer_to_location_2";

/**
 * Maps the legacy category string "Blueprints" to "Gear Blueprints". Leaves
 * other values (including nullish) untouched.
 */
export function mapCategoryForRead<T extends string | null | undefined>(
  category: T,
): T | typeof NEW_CATEGORY_GEAR_BLUEPRINTS {
  if (category === LEGACY_CATEGORY_BLUEPRINTS) {
    return NEW_CATEGORY_GEAR_BLUEPRINTS;
  }
  return category;
}

/**
 * Maps the legacy transfer direction strings to the new location-agnostic
 * equivalents. Leaves other values (including nullish) untouched.
 */
export function mapTransferDirectionForRead<T extends string | null | undefined>(
  direction: T,
): T | typeof NEW_DIRECTION_TO_LOCATION_1 | typeof NEW_DIRECTION_TO_LOCATION_2 {
  if (direction === LEGACY_DIRECTION_TO_HAGGA) {
    return NEW_DIRECTION_TO_LOCATION_1;
  }
  if (direction === LEGACY_DIRECTION_TO_DEEP_DESERT) {
    return NEW_DIRECTION_TO_LOCATION_2;
  }
  return direction;
}

type ResourceRowShape = {
  quantityHagga?: number | null;
  quantityDeepDesert?: number | null;
  quantityLocation1?: number | null;
  quantityLocation2?: number | null;
  category?: string | null;
  [key: string]: unknown;
};

/**
 * Returns a resource row augmented with location-agnostic quantity fields
 * (falling back to the legacy Hagga / Deep Desert columns when the new columns
 * are null/undefined) and with the legacy "Blueprints" category translated to
 * "Gear Blueprints".
 */
export function mapResourceRowForRead<T extends ResourceRowShape>(
  row: T,
): T & { quantityLocation1: number; quantityLocation2: number } {
  const quantityLocation1 =
    row.quantityLocation1 ?? row.quantityHagga ?? 0;
  const quantityLocation2 =
    row.quantityLocation2 ?? row.quantityDeepDesert ?? 0;
  const category = mapCategoryForRead(row.category ?? null);

  return {
    ...row,
    quantityLocation1,
    quantityLocation2,
    category,
  } as T & { quantityLocation1: number; quantityLocation2: number };
}

type HistoryRowShape = {
  previousQuantityHagga?: number | null;
  newQuantityHagga?: number | null;
  changeAmountHagga?: number | null;
  previousQuantityDeepDesert?: number | null;
  newQuantityDeepDesert?: number | null;
  changeAmountDeepDesert?: number | null;
  previousQuantityLocation1?: number | null;
  newQuantityLocation1?: number | null;
  changeAmountLocation1?: number | null;
  previousQuantityLocation2?: number | null;
  newQuantityLocation2?: number | null;
  changeAmountLocation2?: number | null;
  transferDirection?: string | null;
  [key: string]: unknown;
};

/**
 * Returns a resource_history row with location-agnostic quantity tracking
 * fields populated from their legacy Hagga/Deep Desert counterparts when
 * missing, and with the transferDirection translated to the new
 * `transfer_to_location_{1,2}` values.
 */
export function mapHistoryRowForRead<T extends HistoryRowShape>(
  row: T,
): T & {
  previousQuantityLocation1: number | null;
  newQuantityLocation1: number | null;
  changeAmountLocation1: number | null;
  previousQuantityLocation2: number | null;
  newQuantityLocation2: number | null;
  changeAmountLocation2: number | null;
} {
  return {
    ...row,
    previousQuantityLocation1:
      row.previousQuantityLocation1 ?? row.previousQuantityHagga ?? null,
    newQuantityLocation1: row.newQuantityLocation1 ?? row.newQuantityHagga ?? null,
    changeAmountLocation1:
      row.changeAmountLocation1 ?? row.changeAmountHagga ?? null,
    previousQuantityLocation2:
      row.previousQuantityLocation2 ?? row.previousQuantityDeepDesert ?? null,
    newQuantityLocation2:
      row.newQuantityLocation2 ?? row.newQuantityDeepDesert ?? null,
    changeAmountLocation2:
      row.changeAmountLocation2 ?? row.changeAmountDeepDesert ?? null,
    transferDirection: mapTransferDirectionForRead(row.transferDirection ?? null),
  };
}
