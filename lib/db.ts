import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Database schema
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  discordId: text("discord_id").unique().notNull(),
  username: text("username").notNull(),
  avatar: text("avatar"),
  customNickname: text("custom_nickname"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastLogin: integer("last_login", { mode: "timestamp" }).notNull(),
});

export const userSessions = sqliteTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  roles: text("roles").notNull(), // JSON string of roles array
  isInGuild: integer("is_in_guild", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantityHagga: integer("quantity_hagga").notNull().default(0),
  quantityDeepDesert: integer("quantity_deep_desert").notNull().default(0),
  description: text("description"),
  category: text("category"),
  subcategory: text("subcategory"),
  tier: integer("tier"),
  icon: text("icon"), // Emoji or icon identifier like '🪵', '🪨', or ':CustomEmoji:'
  imageUrl: text("image_url"), // URL to resource image
  status: text("status"), // 'at_target', 'below_target', 'critical'
  targetQuantity: integer("target_quantity"), // Target/threshold quantity for status calculation
  multiplier: real("multiplier").notNull().default(1.0), // Points multiplier for this resource
  isPriority: integer("is_priority", { mode: "boolean" })
    .notNull()
    .default(false),
  lastUpdatedBy: text("last_updated_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const resourceHistory = sqliteTable("resource_history", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id),
  previousQuantityHagga: integer("previous_quantity_hagga").notNull(),
  newQuantityHagga: integer("new_quantity_hagga").notNull(),
  changeAmountHagga: integer("change_amount_hagga").notNull(),
  previousQuantityDeepDesert: integer(
    "previous_quantity_deep_desert",
  ).notNull(),
  newQuantityDeepDesert: integer("new_quantity_deep_desert").notNull(),
  changeAmountDeepDesert: integer("change_amount_deep_desert").notNull(),
  changeType: text("change_type").notNull(), // 'absolute', 'relative', or 'transfer'
  updatedBy: text("updated_by").notNull(),
  reason: text("reason"), // Optional reason for the change
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  transferAmount: integer("transfer_amount"),
  transferDirection: text("transfer_direction"), // 'to_deep_desert' or 'to_hagga'
});

export const leaderboard = sqliteTable("leaderboard", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id),
  actionType: text("action_type").notNull(), // 'ADD', 'SET', 'REMOVE'
  quantityChanged: integer("quantity_changed").notNull(),
  basePoints: real("base_points").notNull(), // Points before multipliers
  resourceMultiplier: real("resource_multiplier").notNull(),
  statusBonus: real("status_bonus").notNull(), // Percentage bonus (0.0, 0.05, 0.10)
  finalPoints: real("final_points").notNull(), // Final calculated points
  resourceName: text("resource_name").notNull(),
  resourceCategory: text("resource_category").notNull(),
  resourceStatus: text("resource_status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const globalSettings = sqliteTable("global_settings", {
  settingKey: text("setting_key").primaryKey(),
  settingValue: text("setting_value"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastUpdatedAt: integer("last_updated_at", { mode: "timestamp" }).notNull(),
});

const schema = {
  users,
  userSessions,
  resources,
  resourceHistory,
  leaderboard,
  globalSettings,
};

// --- LAZY INITIALIZATION OF DATABASE ---
let _db: LibSQLDatabase<typeof schema> | null = null;

const getDb = (): LibSQLDatabase<typeof schema> => {
  if (_db === null) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("TURSO_DATABASE_URL environment variable not provided.");
    }

    // Auth token is optional for local development
    const client = createClient({ url, authToken });
    _db = drizzle(client, { schema });
  }
  return _db;
};

// Use a proxy to lazily initialize the db connection.
// This allows the db object to be imported and used anywhere
// without causing an immediate connection. The connection is only
// established when a property on the db object is accessed.
export const db = new Proxy<LibSQLDatabase<typeof schema>>(
  {} as LibSQLDatabase<typeof schema>,
  {
    get(target, prop, receiver) {
      const dbInstance = getDb();
      return Reflect.get(dbInstance, prop, receiver);
    },
  },
);
