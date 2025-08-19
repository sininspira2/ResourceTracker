// This file contains shared constants used throughout the application.

export const CATEGORY_OPTIONS = ['Raw', 'Refined', 'Components', 'Blueprints', 'Other'] as const;

// Time constants in milliseconds
export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = MS_IN_SECOND * 60;
export const MS_IN_HOUR = MS_IN_MINUTE * 60;
export const MS_IN_DAY = MS_IN_HOUR * 24;
export const STALE_THRESHOLD_MS = 48 * MS_IN_HOUR;
export const UPDATE_THRESHOLD_MS = 24 * MS_IN_HOUR;
export const ONE_WEEK_IN_MS = 7 * MS_IN_DAY;
export const STATUS_CHANGE_TIMEOUT_MS = 3000;

// Resource Status
export const RESOURCE_STATUS = {
  CRITICAL: 'critical',
  BELOW_TARGET: 'below_target',
  AT_TARGET: 'at_target',
  ABOVE_TARGET: 'above_target',
} as const;

export const RESOURCE_STATUS_THRESHOLDS = {
  ABOVE_TARGET: 150,
  AT_TARGET: 100,
  BELOW_TARGET: 50,
} as const;

// Update/Transfer types
export const UPDATE_TYPE = {
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
} as const;

export type UpdateType = (typeof UPDATE_TYPE)[keyof typeof UPDATE_TYPE];

export const QUANTITY_FIELD = {
  HAGGA: 'quantityHagga',
  DEEP_DESERT: 'quantityDeepDesert',
} as const;

export type QuantityField = (typeof QUANTITY_FIELD)[keyof typeof QUANTITY_FIELD];

export const TRANSFER_DIRECTION = {
  TO_DEEP_DESERT: 'to_deep_desert',
  TO_HAGGA: 'to_hagga',
} as const;

export type TransferDirection = (typeof TRANSFER_DIRECTION)[keyof typeof TRANSFER_DIRECTION];

// Local Storage
export const LOCAL_STORAGE_KEYS = {
  VIEW_MODE: 'resource-view-mode',
} as const;

export const VIEW_MODE = {
  TABLE: 'table',
  GRID: 'grid',
} as const;

// API
export const API_PREFIX = '/api';
export const RESOURCES_API_PATH = `${API_PREFIX}/resources`;
export const USER_ACTIVITY_API_PATH = `${API_PREFIX}/user/activity`;
export const LEADERBOARD_API_PATH = `${API_PREFIX}/leaderboard`;

// Leaderboard
export const LEADERBOARD_TIME_FILTERS = {
  '24H': '24h',
  '7D': '7d',
  '30D': '30d',
  ALL: 'all',
} as const;

// Miscellaneous
export const WATER_RESOURCE_ID = '45';
export const UNCATEGORIZED = 'Uncategorized';
export const RAW_CATEGORY = 'Raw';
export const COMPONENTS_CATEGORY = 'Components';
export const BP_CATEGORY = 'Blueprints';
