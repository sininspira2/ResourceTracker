/**
 * @jest-environment node
 */
/**
 * @jest-environment node
 */
import { PUT, DELETE } from "./route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db, mockDbExecution } from "@/lib/db";
import { hasResourceAccess, hasResourceAdminAccess } from "@/lib/discord-roles";
import { nanoid } from "nanoid";
import { awardPoints } from "@/lib/leaderboard";

// Mock dependencies
jest.mock("next-auth");
jest.mock("@/lib/auth");
jest.mock("@/lib/db", () => ({
  ...jest.requireActual("@/lib/__mocks__/db"),
  resources: { id: "id" },
  resourceHistory: { resourceId: "resourceId" },
  leaderboard: { resourceId: "resourceId" },
  users: { id: "id", username: "username", customNickname: "customNickname" },
}));
jest.mock("@/lib/discord-roles");
jest.mock("nanoid");
jest.mock("@/lib/leaderboard");

describe("API Routes: /api/resources/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbExecution.mockClear();
  });

  describe("PUT /api/resources/[id]", () => {
    const mockSession = { user: { roles: ["Contributor"] } };
    const mockAdminSession = { user: { roles: ["Admin"] } };
    const mockRequest = (body: any) => ({ json: async () => body } as NextRequest);
    const mockParams = { params: Promise.resolve({ id: "resource-1" }) };

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (hasResourceAccess as jest.Mock).mockReturnValue(true);
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(true);
      (awardPoints as jest.Mock).mockResolvedValue({ finalPoints: 10 });
      (nanoid as jest.Mock).mockReturnValue("history-id");
    });

    it("should update a resource with an absolute value", async () => {
      const initialResource = { id: "resource-1", quantityHagga: 100, quantityDeepDesert: 50 };
      const updatedResource = { ...initialResource, quantityHagga: 150 };
      mockDbExecution
        .mockResolvedValueOnce([initialResource]) // First select in transaction
        .mockResolvedValueOnce(undefined)        // update
        .mockResolvedValueOnce(undefined)        // insert history
        .mockResolvedValueOnce([updatedResource]); // Final select in transaction

      const request = mockRequest({ quantity: 150, quantityField: "quantityHagga" });
      const response = await PUT(request, mockParams);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.resource.quantityHagga).toBe(150);
      expect(db.insert).toHaveBeenCalled();
      expect(awardPoints).toHaveBeenCalled();
    });

    it("should update a resource with a relative value", async () => {
      const initialResource = { id: "resource-1", quantityHagga: 100, quantityDeepDesert: 50 };
      const updatedResource = { ...initialResource, quantityDeepDesert: 30 };
      mockDbExecution
        .mockResolvedValueOnce([initialResource])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([updatedResource]);

      const request = mockRequest({ updateType: "relative", changeValue: -20, quantityField: "quantityDeepDesert" });
      const response = await PUT(request, mockParams);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.resource.quantityDeepDesert).toBe(30);
    });

    it("should allow an admin to act on behalf of another user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const initialResource = { id: "resource-1", quantityHagga: 100, quantityDeepDesert: 50 };
      const updatedResource = { ...initialResource, quantityHagga: 120 };
      mockDbExecution
        .mockResolvedValueOnce([{ username: "testuser", customNickname: "TestUser" }]) // User lookup
        .mockResolvedValueOnce([initialResource]) // First select in transaction
        .mockResolvedValueOnce(undefined)        // update
        .mockResolvedValueOnce(undefined)        // insert history
        .mockResolvedValueOnce([updatedResource]); // Final select in transaction

      const request = mockRequest({ quantity: 120, onBehalfOf: "user-2" });
      await PUT(request, mockParams);

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ updatedBy: "TestUser" }));
    });

    it("should return 404 if resource is not found", async () => {
      mockDbExecution.mockResolvedValueOnce([]); // The select inside the transaction
      const request = mockRequest({ quantity: 150 });
      const response = await PUT(request, mockParams);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Resource not found");
    });
  });

  describe("DELETE /api/resources/[id]", () => {
    const mockAdminSession = { user: { roles: ["Admin"] } };
    const mockRequest = {} as NextRequest;
    const mockParams = { params: Promise.resolve({ id: "resource-1" }) };

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(true);
    });

    it("should delete a resource and its history", async () => {
      mockDbExecution.mockResolvedValueOnce([{ id: "resource-1" }]); // select to find resource
      mockDbExecution.mockResolvedValue(undefined); // for the deletes

      const response = await DELETE(mockRequest, mockParams);

      expect(response.status).toBe(200);
      expect(db.delete).toHaveBeenCalledTimes(3); // history, leaderboard, resource
    });

    it("should return 403 if user is not an admin", async () => {
      (hasResourceAdminAccess as jest.Mock).mockReturnValue(false);
      const response = await DELETE(mockRequest, mockParams);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("Admin access required");
    });

    it("should return 404 if resource is not found", async () => {
      mockDbExecution.mockResolvedValueOnce([]); // select returns empty
      const response = await DELETE(mockRequest, mockParams);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Resource not found");
    });
  });
});