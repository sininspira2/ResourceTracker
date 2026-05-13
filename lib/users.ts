import { db, users } from "./db";
import { inArray } from "drizzle-orm";

/**
 * Batch-resolves Discord IDs to display names using the users table.
 *
 * Returns a map of `discordId → displayName` (customNickname falling back to
 * username). IDs that have no matching row are absent from the map; callers
 * should fall back to the raw stored value for those (pre-migration entries
 * that still contain a nickname string rather than a Discord ID).
 *
 * Accepts an empty array gracefully (returns an empty map without querying).
 */
export async function resolveDisplayNames(
  discordIds: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const ids = discordIds.filter((id): id is string => !!id);
  if (ids.length === 0) return {};
  const rows = await db
    .select({
      discordId: users.discordId,
      customNickname: users.customNickname,
      username: users.username,
    })
    .from(users)
    .where(inArray(users.discordId, ids));
  return Object.fromEntries(
    rows.map((u) => [u.discordId, u.customNickname || u.username]),
  );
}
