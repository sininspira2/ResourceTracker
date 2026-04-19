/**
 * @jest-environment node
 */
import { POST } from "@/app/api/resources/bulk/confirm/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db, resourceHistory } from "@/lib/db";
import { hasTargetEditAccess } from "@/lib/discord-roles";
import { nanoid } from "nanoid";

jest.mock("next-auth");
jest.mock("@/lib/discord-roles");
jest.mock("nanoid");

jest.mock("@/lib/db", () => ({
  db: {
    transaction: jest.fn(),
  },
  resources: { id: "resources.id" },
  resourceHistory: { id: "resourceHistory.id" },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockHasTargetEditAccess = hasTargetEditAccess as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;
const mockNanoId = nanoid as jest.Mock;

describe("POST /api/resources/bulk/confirm", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: {
        id: "test-user-id",
        discordNickname: "TestUser",
        roles: ["OfficerHR"],
        permissions: { hasTargetEditAccess: true },
      },
    });

    mockHasTargetEditAccess.mockReturnValue(true);
    mockNanoId.mockReturnValue("mock-nanoid");

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const createRequest = (body: unknown) => {
    return {
      json: () => Promise.resolve(body),
    } as unknown as NextRequest;
  };

  it("should return 403 if user lacks target-edit access", async () => {
    mockHasTargetEditAccess.mockReturnValue(false);
    const request = createRequest([
      { id: "r1", status: "changed", new: { quantityHagga: 10, quantityDeepDesert: 5, targetQuantity: 20 } },
    ]);
    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
  });

  it("should return 400 if body is not an array", async () => {
    const request = createRequest({ id: "r1", status: "changed" });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 if array is empty", async () => {
    const request = createRequest([]);
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 if array has more than 1000 items", async () => {
    const items = Array.from({ length: 1001 }, (_, i) => ({
      id: `r${i}`,
      status: "changed",
      new: { quantityHagga: 1, quantityDeepDesert: 0, targetQuantity: null },
    }));
    const request = createRequest(items);
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should successfully apply changed updates and log history", async () => {
    const currentResource = {
      id: "r1",
      quantityHagga: 10,
      quantityDeepDesert: 5,
      targetQuantity: 20,
    };

    let capturedTx: any;
    mockDb.transaction.mockImplementation(async (callback) => {
      const mockInsertValues = jest.fn().mockResolvedValue(undefined);
      capturedTx = {
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn().mockResolvedValue([currentResource]),
          })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn().mockResolvedValue(undefined),
          })),
        })),
        insert: jest.fn(() => ({ values: mockInsertValues })),
        mockInsertValues,
      };
      return callback(capturedTx);
    });

    const request = createRequest([
      {
        id: "r1",
        status: "changed",
        new: { quantityHagga: 25, quantityDeepDesert: 8, targetQuantity: 30 },
      },
    ]);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("Import successful");

    expect(capturedTx.insert).toHaveBeenCalledWith(resourceHistory);
    expect(capturedTx.mockInsertValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          changeType: "absolute",
          reason: "Bulk CSV import",
          resourceId: "r1",
          previousQuantityHagga: 10,
          newQuantityHagga: 25,
          changeAmountHagga: 15,
          previousQuantityDeepDesert: 5,
          newQuantityDeepDesert: 8,
          changeAmountDeepDesert: 3,
          updatedBy: expect.any(String),
        }),
      ]),
    );
  });

  it("should de-duplicate updates and only process the last entry per resource ID", async () => {
    const currentResource = {
      id: "r1",
      quantityHagga: 10,
      quantityDeepDesert: 5,
      targetQuantity: 20,
    };

    let capturedTx: any;
    mockDb.transaction.mockImplementation(async (callback) => {
      const mockInsertValues = jest.fn().mockResolvedValue(undefined);
      capturedTx = {
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn().mockResolvedValue([currentResource]),
          })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn().mockResolvedValue(undefined),
          })),
        })),
        insert: jest.fn(() => ({ values: mockInsertValues })),
        mockInsertValues,
      };
      return callback(capturedTx);
    });

    const request = createRequest([
      {
        id: "r1",
        status: "changed",
        new: { quantityHagga: 5, quantityDeepDesert: 2, targetQuantity: 10 },
      },
      {
        id: "r1",
        status: "changed",
        new: { quantityHagga: 99, quantityDeepDesert: 99, targetQuantity: 99 },
      },
    ]);
    const response = await POST(request);

    expect(response.status).toBe(200);
    // De-duplication: insert called exactly once for r1 (last entry wins)
    expect(capturedTx.mockInsertValues).toHaveBeenCalledTimes(1);
    expect(capturedTx.mockInsertValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          newQuantityHagga: 99,
          newQuantityDeepDesert: 99,
        }),
      ]),
    );
  });

  it("should skip items that do not have status: 'changed'", async () => {
    let capturedTx: any;
    mockDb.transaction.mockImplementation(async (callback) => {
      const mockInsertValues = jest.fn().mockResolvedValue(undefined);
      capturedTx = {
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn().mockResolvedValue([]),
          })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn().mockResolvedValue(undefined),
          })),
        })),
        insert: jest.fn(() => ({ values: mockInsertValues })),
        mockInsertValues,
      };
      return callback(capturedTx);
    });

    const request = createRequest([
      {
        id: "r1",
        status: "unchanged",
        new: { quantityHagga: 10, quantityDeepDesert: 5, targetQuantity: 20 },
      },
    ]);
    const response = await POST(request);

    expect(response.status).toBe(200);
    // No inserts because all items were filtered out as non-"changed"
    expect(capturedTx.mockInsertValues).not.toHaveBeenCalled();
  });

  it("should return 500 on database error", async () => {
    mockDb.transaction.mockRejectedValue(new Error("DB connection lost"));

    const request = createRequest([
      {
        id: "r1",
        status: "changed",
        new: { quantityHagga: 10, quantityDeepDesert: 5, targetQuantity: 20 },
      },
    ]);
    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to import data");
  });
});
