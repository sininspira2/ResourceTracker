/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { UserSession } from "@/lib/auth";
import { db } from "@/tests/__mocks__/db";

describe("DELETE /api/resources/[id]/history/[entryId]", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(null),
    }));
    const { DELETE } = await import(
      "@/app/api/resources/[id]/history/[entryId]/route"
    );
    const request = new NextRequest(
      "http://localhost/api/resources/123/history/456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123", entryId: "456" }),
    });
    expect(response.status).toBe(401);
  });

  it("should return 403 if user does not have admin access", async () => {
    const mockSession: UserSession = {
      user: {
        id: "1",
        name: "test",
        email: "",
        image: "",
        roles: ["Contributor"],
      },
      expires: "",
    };
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(mockSession),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAdminAccess: jest.fn().mockReturnValue(false),
    }));
    const { DELETE } = await import(
      "@/app/api/resources/[id]/history/[entryId]/route"
    );
    const request = new NextRequest(
      "http://localhost/api/resources/123/history/456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123", entryId: "456" }),
    });
    expect(response.status).toBe(403);
  });

  it("should return 404 if the history entry is not found", async () => {
    const mockSession: UserSession = {
      user: { id: "1", name: "test", email: "", image: "", roles: ["Admin"] },
      expires: "",
    };
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(mockSession),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAdminAccess: jest.fn().mockReturnValue(true),
    }));
    jest.doMock("@/lib/db", () => {
      const dbMock = require("@/tests/__mocks__/db");
      (dbMock.db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      return dbMock;
    });

    const { DELETE } = await import(
      "@/app/api/resources/[id]/history/[entryId]/route"
    );
    const request = new NextRequest(
      "http://localhost/api/resources/123/history/456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123", entryId: "456" }),
    });
    expect(response.status).toBe(404);
  });

  it("should delete the history entry and return 200 on success", async () => {
    const mockSession: UserSession = {
      user: { id: "1", name: "test", email: "", image: "", roles: ["Admin"] },
      expires: "",
    };
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(mockSession),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasResourceAdminAccess: jest.fn().mockReturnValue(true),
    }));
    jest.doMock("@/lib/db", () => {
      const dbMock = require("@/tests/__mocks__/db");
      (dbMock.db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: "456" }]),
      });
      (dbMock.db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      return dbMock;
    });

    const { DELETE } = await import(
      "@/app/api/resources/[id]/history/[entryId]/route"
    );
    const request = new NextRequest(
      "http://localhost/api/resources/123/history/456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123", entryId: "456" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: "History entry deleted successfully",
    });
  });
});
