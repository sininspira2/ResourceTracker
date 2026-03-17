/**
 * Calculate resource status based on current total quantity vs target.
 */
export const calculateResourceStatus = (
  quantity: number,
  targetQuantity: number | null,
): "above_target" | "at_target" | "below_target" | "critical" => {
  if (quantity < 0 || (targetQuantity !== null && targetQuantity < 0)) {
    throw new TypeError(
      `calculateResourceStatus: quantity and targetQuantity must be non-negative (got quantity=${quantity}, targetQuantity=${targetQuantity})`,
    );
  }
  if (!targetQuantity || targetQuantity === 0) return "at_target";

  const percentage = (quantity / targetQuantity) * 100;
  if (percentage >= 150) return "above_target"; // Purple - well above target
  if (percentage >= 100) return "at_target"; // Green - at or above target
  if (percentage >= 50) return "below_target"; // Orange - below target but not critical
  return "critical"; // Red - very much below target
};
