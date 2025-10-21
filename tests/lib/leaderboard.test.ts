/**
 * @jest-environment node
 */
import { calculatePoints } from "@/lib/leaderboard";

// This is a pure function, so it doesn't need complex mocking.
describe("calculatePoints", () => {
  it("should return 0 points for REMOVE actions", () => {
    const result = calculatePoints("REMOVE", 100, 1.5, "at_target", "Raw");
    expect(result.finalPoints).toBe(0);
  });

  it("should return a fixed amount of points for SET actions", () => {
    const result = calculatePoints("SET", 100, 1.5, "at_target", "Raw");
    expect(result.finalPoints).toBe(1);
  });

  it("should calculate points for ADD actions", () => {
    const result = calculatePoints("ADD", 1000, 1, "at_target", "Raw");
    expect(result.finalPoints).toBe(100);
  });

  it("should apply a resource multiplier", () => {
    const result = calculatePoints("ADD", 1000, 1.5, "at_target", "Raw");
    expect(result.finalPoints).toBe(150);
  });

  it("should apply a status bonus", () => {
    const result = calculatePoints("ADD", 1000, 1, "critical", "Raw");
    expect(result.finalPoints).toBe(110);
  });
});

describe("awardPoints", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should award points and create a leaderboard entry", async () => {
    const mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
    };

    const { awardPoints } = await import("@/lib/leaderboard");
    await awardPoints(
      "test-user",
      "test-resource",
      "ADD",
      1000,
      { name: "Test Resource", category: "Raw", status: "at_target", multiplier: 1 },
      mockDb,
    );

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalled();
  });
});

describe("getLeaderboard", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return leaderboard rankings", async () => {
    const rankings = [{ userId: "test-user", totalPoints: 100 }];
    const countResult = [{ count: 1 }];

    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(rankings),
    };
    // The first query for total count is awaited on `where`
    (mockDb.where as jest.Mock).mockResolvedValueOnce(countResult);

    jest.doMock("@/lib/db", () => ({ db: mockDb, leaderboard: {}, sql: jest.fn(), gte: jest.fn() }));

    const { getLeaderboard } = await import("@/lib/leaderboard");
    const result = await getLeaderboard("all", 50, 0);

    expect(result.rankings).toEqual(rankings);
    expect(result.total).toBe(1);
  });
});

describe("getUserContributions", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return user contributions", async () => {
    const contributions = [{ id: "1" }];
    const countResult = [{ count: 1 }];
    const summaryResult = [{ totalPoints: 100, totalActions: 1 }];

    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn(), // This will be customized below
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(contributions),
    };

    // There are 3 queries. The first two are awaited on `where`.
    (mockDb.where as jest.Mock)
      .mockResolvedValueOnce(countResult)
      .mockImplementationOnce(() => mockDb) // for the main query, to be chained
      .mockResolvedValueOnce(summaryResult);

    jest.doMock("@/lib/db", () => ({ db: mockDb, leaderboard: {}, sql: jest.fn(), gte: jest.fn(), and: jest.fn(), eq: jest.fn(), desc: jest.fn() }));

    const { getUserContributions } = await import("@/lib/leaderboard");
    const result = await getUserContributions("test-user", "all", 100, 0);

    expect(result.contributions).toEqual(contributions);
    expect(result.total).toBe(1);
    expect(result.summary).toEqual(summaryResult[0]);
  });
});

describe("getUserRank", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return user rank", async () => {
    const subquery = { rank: "rank_col" };
    const finalResult = [{ rank: 1 }];

    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      as: jest.fn(() => subquery),
    };

    // When `from` is called with the subquery, `where` should resolve the final value
    (mockDb.from as jest.Mock).mockImplementation(function (fromArg) {
      if (fromArg === subquery) {
        this.where = jest.fn().mockResolvedValue(finalResult);
      }
      return this;
    });

    jest.doMock("@/lib/db", () => ({ db: mockDb, leaderboard: {}, sql: jest.fn(), gte: jest.fn(), eq: jest.fn() }));

    const { getUserRank } = await import("@/lib/leaderboard");
    const result = await getUserRank("test-user", "all");

    expect(result).toBe(1);
  });
});
