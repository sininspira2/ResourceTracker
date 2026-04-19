// This file contains shared constants used throughout the application.

export const CATEGORY_OPTIONS = [
  "Raw",
  "Refined",
  "Components",
  "Gear Blueprints",
  "Gear",
  "Augmentations",
  "Augmentation Blueprints",
  "Other",
] as const;

// Time constants in milliseconds
export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = MS_IN_SECOND * 60;
export const MS_IN_HOUR = MS_IN_MINUTE * 60;
export const MS_IN_DAY = MS_IN_HOUR * 24;
export const UPDATE_THRESHOLD_PRIORITY_MS = 24 * MS_IN_HOUR;
export const ONE_WEEK_IN_MS = 7 * MS_IN_DAY;
export const UPDATE_THRESHOLD_NON_PRIORITY_MS = ONE_WEEK_IN_MS;
export const STATUS_CHANGE_TIMEOUT_MS = 3000;

// Resource Status
export const RESOURCE_STATUS = {
  CRITICAL: "critical",
  BELOW_TARGET: "below_target",
  AT_TARGET: "at_target",
  ABOVE_TARGET: "above_target",
} as const;

export const RESOURCE_STATUS_THRESHOLDS = {
  ABOVE_TARGET: 150,
  AT_TARGET: 100,
  BELOW_TARGET: 50,
} as const;

// Update/Transfer types
export const UPDATE_TYPE = {
  ABSOLUTE: "absolute",
  RELATIVE: "relative",
} as const;

export type UpdateType = (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE];

export const QUANTITY_FIELD = {
  HAGGA: "quantityHagga",
  DEEP_DESERT: "quantityDeepDesert",
  LOCATION_1: "quantityLocation1",
  LOCATION_2: "quantityLocation2",
} as const;

export type QuantityField =
  (typeof QUANTITY_FIELD)[keyof typeof QUANTITY_FIELD];

export const TRANSFER_DIRECTION = {
  TO_DEEP_DESERT: "to_deep_desert",
  TO_HAGGA: "to_hagga",
  TO_LOCATION_1: "transfer_to_location_1",
  TO_LOCATION_2: "transfer_to_location_2",
} as const;

export type TransferDirection =
  (typeof TRANSFER_DIRECTION)[keyof typeof TRANSFER_DIRECTION];

// Local Storage
export const LOCAL_STORAGE_KEYS = {
  VIEW_MODE: "resource-view-mode",
} as const;

export const VIEW_MODE = {
  TABLE: "table",
  GRID: "grid",
} as const;

// API
export const API_PREFIX = "/api";
export const RESOURCES_API_PATH = `${API_PREFIX}/resources`;
export const USER_ACTIVITY_API_PATH = `${API_PREFIX}/user/activity`;
export const LEADERBOARD_API_PATH = `${API_PREFIX}/leaderboard`;

// Leaderboard
export const LEADERBOARD_TIME_FILTERS = {
  "24H": "24h",
  "7D": "7d",
  "30D": "30d",
  ALL: "all",
} as const;

// Miscellaneous
export const WATER_RESOURCE_ID = "45";
export const UNCATEGORIZED = "Uncategorized";
export const RAW_CATEGORY = "Raw";
export const COMPONENTS_CATEGORY = "Components";
export const BP_CATEGORY = "Gear Blueprints";

export const TIER_OPTIONS = [
  { value: "0", label: "Tier 0 (Scrap)" },
  { value: "1", label: "Tier 1 (Copper)" },
  { value: "2", label: "Tier 2 (Iron)" },
  { value: "3", label: "Tier 3 (Steel)" },
  { value: "4", label: "Tier 4 (Aluminum)" },
  { value: "5", label: "Tier 5 (Duraluminum)" },
  { value: "6", label: "Tier 6/Grade 0 (Plastanium)" },
  { value: "7", label: "Grade 1" },
  { value: "8", label: "Grade 2" },
  { value: "9", label: "Grade 3" },
  { value: "10", label: "Grade 4" },
  { value: "11", label: "Grade 5" },
];

export const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  Raw: ["Ore", "Gathered"],
  Refined: [
    "Ore Refined",
    "Chemical Refined",
    "Survival Fabricator",
    "Spice Refined",
  ],
  Components: ["Looted", "Craftable"],
  "Gear Blueprints": [
    "Heavy Armor",
    "Light Armor",
    "Stillsuits",
    "Vehicle",
    "Weapon",
    "Utility",
  ],
  Gear: [
    "Heavy Armor",
    "Light Armor",
    "Stillsuits",
    "Vehicle",
    "Weapon",
    "Utility",
  ],
  Augmentations: ["Garment", "Melee", "Ranged", "Generic"],
  "Augmentation Blueprints": ["Garment", "Melee", "Ranged", "Generic"],
  Other: ["Ammo", "Currency"],
};

export const ALL_SUBCATEGORIES = [
  ...new Set(Object.values(SUBCATEGORY_OPTIONS).flat()),
];
