export const mockDbExecution = jest.fn();
const subqueryMock = { rank: "rank_col" };

export const db = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  as: jest.fn(() => subqueryMock),
  then: jest.fn((resolve) => resolve(mockDbExecution())),
  transaction: jest.fn(async (callback) => await callback(db)),
};

export const leaderboard = {
  userId: "leaderboard.userId",
  createdAt: "leaderboard.createdAt",
};

export const resources = {
  id: "resources.id",
  name: "resources.name",
};

export const users = {
  id: "users.id",
  discordId: "users.discordId",
  username: "users.username",
  avatar: "users.avatar",
  customNickname: "users.customNickname",
  createdAt: "users.createdAt",
  lastLogin: "users.lastLogin",
};

export const resourceHistory = {
  id: "resourceHistory.id",
  resourceId: "resourceHistory.resourceId",
  createdAt: "resourceHistory.createdAt",
};
