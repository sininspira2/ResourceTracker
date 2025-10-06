import { calculatePoints, awardPoints, getLeaderboard, getUserContributions, getUserRank } from './leaderboard';
import { db, mockDbExecution } from './db';

// Tell Jest to use the manual mock in `lib/__mocks__/db.ts`
jest.mock('./db');

// Mock other external dependencies
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  desc: jest.fn(),
  sql: jest.fn(() => ({ as: jest.fn() })),
  and: jest.fn(),
  gte: jest.fn(),
}));

describe('lib/leaderboard.ts', () => {
  beforeEach(() => {
    // Clear all mock states before each test
    jest.clearAllMocks();
    mockDbExecution.mockClear();
  });

  describe('calculatePoints', () => {
    it('should return 0 points for REMOVE actions', () => {
      const result = calculatePoints('REMOVE', 100, 1.5, 'critical', 'Components');
      expect(result.finalPoints).toBe(0);
    });

    it('should return 0 points for ineligible categories', () => {
      const result = calculatePoints('ADD', 100, 1, 'at_target', 'ineligible-category');
      expect(result.finalPoints).toBe(0);
    });

    it('should return a fixed amount for SET actions', () => {
      const result = calculatePoints('SET', 5000, 2.0, 'critical', 'Components');
      expect(result.finalPoints).toBe(1);
    });

    it('should return a flat 2 points for the Refined category', () => {
      const result = calculatePoints('ADD', 100, 1.5, 'critical', 'Refined');
      expect(result.finalPoints).toBe(2);
    });

    it('should calculate points correctly for ADD actions', () => {
      const result = calculatePoints('ADD', 1000, 1.0, 'at_target', 'Raw');
      expect(result.finalPoints).toBe(100);
    });

    it('should apply a resource multiplier', () => {
      const result = calculatePoints('ADD', 1000, 1.5, 'at_target', 'Components');
      expect(result.finalPoints).toBe(150);
    });

    it('should apply a status bonus', () => {
      const result = calculatePoints('ADD', 1000, 1.0, 'critical', 'Raw');
      expect(result.finalPoints).toBe(110);
    });

    it('should apply both multiplier and status bonus', () => {
      const result = calculatePoints('ADD', 1000, 1.5, 'below_target', 'Components');
      expect(result.finalPoints).toBe(157.5);
    });
  });

  describe('awardPoints', () => {
    const resourceData = { name: 'Test', category: 'Components', status: 'critical', multiplier: 1.5 };

    it('should insert a record if points are earned', async () => {
      mockDbExecution.mockResolvedValueOnce(undefined);
      await awardPoints('user-1', 'resource-1', 'ADD', 100, resourceData, db);

      expect(db.insert).toHaveBeenCalledWith('leaderboard');
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    });

    it('should not insert a record if no points are earned', async () => {
      await awardPoints('user-1', 'resource-1', 'REMOVE', 100, resourceData, db);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should return rankings and total', async () => {
      mockDbExecution
        .mockResolvedValueOnce([{ count: 50 }])
        .mockResolvedValueOnce([{ userId: 'user-1' }]);

      const result = await getLeaderboard('7d', 10, 5);

      expect(db.limit).toHaveBeenCalledWith(10);
      expect(db.offset).toHaveBeenCalledWith(5);
      expect(result.total).toBe(50);
      expect(result.rankings[0].userId).toBe('user-1');
      expect(mockDbExecution).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserContributions', () => {
    it('should fetch contributions and summary', async () => {
      mockDbExecution
        .mockResolvedValueOnce([{ count: 25 }])
        .mockResolvedValueOnce([{ id: 'entry-1' }])
        .mockResolvedValueOnce([{ totalPoints: 150 }]);

      const result = await getUserContributions('user-1', '30d', 20, 10);

      expect(result.total).toBe(25);
      expect(result.contributions.length).toBe(1);
      expect(result.summary.totalPoints).toBe(150);
      expect(mockDbExecution).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUserRank', () => {
    it('should return the correct rank', async () => {
      mockDbExecution.mockResolvedValueOnce([{ rank: 5 }]);
      const rank = await getUserRank('user-1', 'all');
      expect(rank).toBe(5);
    });

    it('should return null if user is not found', async () => {
      mockDbExecution.mockResolvedValueOnce([]);
      const rank = await getUserRank('non-existent-user');
      expect(rank).toBeNull();
    });
  });
});