/**
 * @jest-environment node
 */
import { PUT } from "./route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db, resources } from "@/lib/db";
import { hasResourceAccess, hasTargetEditAccess } from "@/lib/discord-roles";

jest.mock("next-auth");
jest.mock("@/lib/discord-roles");
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
  resources: {
    id: "resources.id",
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockHasResourceAccess = hasResourceAccess as jest.Mock;
const mockHasTargetEditAccess = hasTargetEditAccess as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

describe("PUT /api/resources/[id]/target", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // Default session and permissions for most tests
    mockGetServerSession.mockResolvedValue({
      user: {
        id: "test-user-id",
        roles: ["Admin"],
        // A more realistic session object
        discordNickname: "TestUser",
        image: "test-image-url",
        email: "test@example.com",
        isInGuild: true,
        permissions: {
          canAccessResources: true,
          canEditTargets: true,
          canManageUsers: true,
          canExportData: true,
          isAdmin: true,
        },
      },
    });

    mockHasResourceAccess.mockReturnValue(true);
    mockHasTargetEditAccess.mockReturnValue(true);

    // Reset mocks on the db object to clear internal states
    (mockDb.select as jest.Mock).mockReturnThis();
    (mockDb.from as jest.Mock).mockReturnThis();
    (mockDb.update as jest.Mock).mockReturnThis();
    (mockDb.set as jest.Mock).mockReturnThis();
  });

  const createRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
    } as unknown as NextRequest;
  };

  it("should return 401 if the user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = createRequest({ targetQuantity: 100 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });
    expect(response.status).toBe(401);
  });

  it("should return 403 if the user does not have permission to edit targets", async () => {
    mockHasTargetEditAccess.mockReturnValue(false);
    const request = createRequest({ targetQuantity: 100 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Insufficient permissions - admin access required");
  });

  it("should return 400 if targetQuantity is negative", async () => {
    const request = createRequest({ targetQuantity: -10 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Target quantity cannot be negative");
  });

  it("should return 404 if the resource is not found", async () => {
    // Mock the db call to find the resource to return an empty array
    (mockDb.where as jest.Mock).mockResolvedValueOnce([]);
    const request = createRequest({ targetQuantity: 100 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "not-found-id" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Resource not found");
  });

  it("should successfully update the target quantity", async () => {
    const initialResource = { id: "test-resource-id", targetQuantity: 50 };
    const updatedData = {
      targetQuantity: 100,
      lastUpdatedBy: "TestUser", // As derived by getUserIdentifier
      updatedAt: expect.any(Date),
    };
    const finalResource = { ...initialResource, ...updatedData };

    // Mock the sequence of db calls
    (mockDb.where as jest.Mock)
      // 1. Check if resource exists
      .mockResolvedValueOnce([initialResource])
      // 2. The `update` call's where
      .mockResolvedValueOnce(undefined) // update().set().where() doesn't resolve a value itself
      // 3. Get the updated resource to return
      .mockResolvedValueOnce([finalResource]);

    const request = createRequest({ targetQuantity: 100 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(mockDb.update).toHaveBeenCalledWith(resources);
    expect(mockDb.set).toHaveBeenCalledWith(updatedData);
    expect(body.targetQuantity).toBe(100);
    expect(body.lastUpdatedBy).toBe("TestUser");
  });

  it("should return 500 on database error during initial fetch", async () => {
    (mockDb.where as jest.Mock).mockRejectedValueOnce(
      new Error("Database connection failed"),
    );
    const request = createRequest({ targetQuantity: 100 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to update target quantity");
  });

  it("should return 500 on database error during update", async () => {
    const initialResource = { id: "test-resource-id", targetQuantity: 50 };
    (mockDb.where as jest.Mock)
      // 1. Check if resource exists - success
      .mockResolvedValueOnce([initialResource])
      // 2. The `update` call's where - throw error
      .mockRejectedValueOnce(new Error("Update failed"));

    const request = createRequest({ targetQuantity: 100 });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "test-resource-id" }),
    });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to update target quantity");
  });
});