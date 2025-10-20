/**
 * @jest-environment node
 */
import { POST, PUT, GET } from "@/app/api/resources/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db, mockDbExecution } from "@/lib/db";
import { hasResourceAdminAccess, hasResourceAccess } from "@/lib/discord-roles";
import { nanoid } from "nanoid";
import { awardPoints } from "@/lib/leaderboard";

// Mock dependencies
jest.mock("next-auth");
jest.mock("@/lib/auth");
jest.mock("@/lib/db", () => ({
  ...jest.requireActual("@/lib/__mocks__/db"),
  resources: { id: "id" },
}));
jest.mock("@/lib/discord-roles");
jest.mock("nanoid");
jest.mock("@/lib/leaderboard");

describe("API Routes: /api/resources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbExecution.mockClear();
  });

  describe("POST /api/resources", () => {
    const mockSession = { user: { roles: ["Admin"] } };
    const mockRequest = (body: any) =>
      ({
        json: async () => body,
      }) as NextRequest;

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(true);
      (nanoid as jest.Mock).mockReturnValue("new-resource-id");
    });

    it("should create a new resource and return it", async () => {
      const newResourceData = {
        name: "Test Resource",
        category: "Test Category",
        quantityHagga: 100,
      };
      // Mock the .returning() call to provide the created resource
      mockDbExecution.mockResolvedValue([
        { ...newResourceData, id: "new-resource-id" },
      ]);

      const request = mockRequest(newResourceData);
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.name).toBe("Test Resource");
      expect(body.id).toBe("new-resource-id");
      expect(db.transaction).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
    });

    it("should return 403 if user is not an admin", async () => {
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(false);
      const request = mockRequest({ name: "Test", category: "Test" });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Admin access required");
    });

    it("should return 400 if name or category are missing", async () => {
      const request = mockRequest({ name: "Test Resource" }); // Missing category
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Name and category are required");
    });
  });

  describe("PUT /api/resources (Metadata)", () => {
    const mockSession = { user: { roles: ["Admin"] } };
    const mockRequest = (body: any) =>
      ({
        json: async () => body,
      }) as NextRequest;

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(true);
    });

    it("should update resource metadata and return the updated resource", async () => {
      const metadata = {
        id: "resource-1",
        name: "Updated Name",
        category: "Updated Category",
      };
      mockDbExecution.mockResolvedValueOnce(undefined); // for the update
      mockDbExecution.mockResolvedValueOnce([metadata]); // for the select

      const request = mockRequest({ resourceMetadata: metadata });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.name).toBe("Updated Name");
      expect(db.update).toHaveBeenCalled();
    });

    it("should return 403 if user is not an admin", async () => {
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(false);
      const request = mockRequest({
        resourceMetadata: { id: "1", name: "Test", category: "Test" },
      });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Admin access required");
    });

    it("should return 400 if id, name, or category are missing", async () => {
      const request = mockRequest({
        resourceMetadata: { id: "1", name: "Test" },
      }); // Missing category
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("ID, name, and category are required");
    });
  });

  describe("PUT /api/resources (Bulk Quantity)", () => {
    const mockSession = { user: { roles: ["Contributor"] } };
    const mockRequest = (body: any) =>
      ({
        json: async () => body,
      }) as NextRequest;

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (hasResourceAccess as jest.Mock).mockReturnValue(true);
      (awardPoints as jest.Mock).mockResolvedValue({ finalPoints: 10 });
    });

    it("should update quantities and return updated resources", async () => {
      const updates = [
        { id: "resource-1", quantity: 200, updateType: "absolute" },
      ];
      const mockResource = {
        id: "resource-1",
        quantityHagga: 100,
        quantityDeepDesert: 50,
      };
      mockDbExecution
        .mockResolvedValueOnce([mockResource]) // select current
        .mockResolvedValueOnce(undefined) // update
        .mockResolvedValueOnce(undefined) // insert history
        .mockResolvedValueOnce([mockResource]); // select all for return

      const request = mockRequest({ resourceUpdates: updates });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalPointsEarned).toBe(10);
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(awardPoints).toHaveBeenCalled();
    });

    it("should return 403 if user does not have resource access", async () => {
      (hasResourceAccess as jest.Mock).mockReturnValue(false);
      const request = mockRequest({ resourceUpdates: [] });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Resource access required");
    });

    it("should return 400 for invalid resourceUpdates format", async () => {
      const request = mockRequest({ resourceUpdates: "not-an-array" });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid resourceUpdates format");
    });
  });
});
