/**
 * @jest-environment node
 */
import { PUT } from "./route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { hasResourceAccess } from "@/lib/discord-roles";
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
const mockHasResourceAccess = hasResourceAccess as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;
const mockNanoId = nanoid as jest.Mock;

describe("PUT /api/resources/[id]/transfer", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: {
        id: "test-user-id",
        discordNickname: "TestUser",
        roles: ["Contributor"],
        permissions: { hasResourceAccess: true },
      },
    });

    mockHasResourceAccess.mockReturnValue(true);
    mockNanoId.mockReturnValue("mock-nanoid");
  });

  const createRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
    } as unknown as NextRequest;
  };

  it("should return 401 if user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = createRequest({
      transferAmount: 10,
      transferDirection: "to_deep_desert",
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });
    expect(response.status).toBe(401);
  });

  it("should return 400 for invalid request body", async () => {
    // Missing direction
    let request = createRequest({ transferAmount: 10 });
    let response = await PUT(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    expect(response.status).toBe(400);

    // Missing amount
    request = createRequest({ transferDirection: "to_hagga" });
    response = await PUT(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    expect(response.status).toBe(400);

    // Invalid direction
    request = createRequest({
      transferAmount: 10,
      transferDirection: "to_the_moon",
    });
    response = await PUT(request, {
      params: Promise.resolve({ id: "test-id" }),
    });
    expect(response.status).toBe(400);
  });

  it("should return 404 if resource is not found", async () => {
    mockDb.transaction.mockImplementation(async (callback) => {
      const tx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      return callback(tx);
    });

    const request = createRequest({
      transferAmount: 10,
      transferDirection: "to_deep_desert",
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "not-found-id" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Resource not found");
  });

  it("should return 400 for insufficient quantity", async () => {
    const resource = {
      id: "test-id",
      quantityHagga: 5,
      quantityDeepDesert: 10,
    };
    mockDb.transaction.mockImplementation(async (callback) => {
      const tx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([resource]),
      };
      return callback(tx);
    });

    const request = createRequest({
      transferAmount: 10,
      transferDirection: "to_deep_desert",
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-id" }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Insufficient quantity in Hagga base");
  });

  it("should successfully transfer resources", async () => {
    const resource = {
      id: "test-id",
      quantityHagga: 50,
      quantityDeepDesert: 10,
    };
    const updatedResource = {
      ...resource,
      quantityHagga: 40,
      quantityDeepDesert: 20,
    };

    mockDb.transaction.mockImplementation(async (callback) => {
      const whereMock = jest
        .fn()
        .mockResolvedValueOnce([resource])
        .mockResolvedValueOnce([updatedResource]);

      const txMock = {
        select: jest.fn(() => ({
          from: jest.fn(() => ({ where: whereMock })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn().mockResolvedValue(undefined),
          })),
        })),
        insert: jest.fn(() => ({
          values: jest.fn().mockResolvedValue(undefined),
        })),
      };
      return callback(txMock);
    });

    const request = createRequest({
      transferAmount: 10,
      transferDirection: "to_deep_desert",
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-id" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.resource.quantityHagga).toBe(40);
  });

  it("should return 500 on generic database error", async () => {
    mockDb.transaction.mockRejectedValue(new Error("DB connection lost"));

    const request = createRequest({
      transferAmount: 10,
      transferDirection: "to_deep_desert",
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-id" }),
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to transfer resource quantity");
  });
});
