export const mockDbExecution = jest.fn();
const subqueryMock = { rank: "rank_col", userId: "userId_col" };

export const db = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
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
  then: function (
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ) {
    return mockDbExecution().then(resolve, reject);
  },
  transaction: jest.fn(async (callback) => await callback(db)),
};

export const leaderboard = "leaderboard";
