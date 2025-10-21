/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

describe("GET /api/users", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return a 403 Forbidden response when the user is not authenticated", async () => {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(null),
    }));

    const { GET } = await import("@/app/api/users/route");
    const request = new NextRequest("http://localhost/api/users");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should return a 403 Forbidden response when the user does not have the required permissions", async () => {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: {
          permissions: {
            hasUserManagementAccess: false,
            hasResourceAdminAccess: false,
          },
        },
      }),
    }));

    const { GET } = await import("@/app/api/users/route");
    const request = new NextRequest("http://localhost/api/users");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should return a 200 OK response and the user list when the user has hasUserManagementAccess permission", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "testuser1",
        customNickname: "Test User 1",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    ];

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: {
          permissions: {
            hasUserManagementAccess: true,
            hasResourceAdminAccess: false,
          },
        },
      }),
    }));

    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockResolvedValue(mockUsers),
      },
      users: {},
    }));

    const { GET } = await import("@/app/api/users/route");
    const request = new NextRequest("http://localhost/api/users");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockUsers);
  });

  it("should return a 200 OK response and the user list when the user has hasResourceAdminAccess permission", async () => {
    const mockUsers = [
      {
        id: "1",
        username: "testuser1",
        customNickname: "Test User 1",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    ];

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: {
          permissions: {
            hasUserManagementAccess: false,
            hasResourceAdminAccess: true,
          },
        },
      }),
    }));

    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockResolvedValue(mockUsers),
      },
      users: {},
    }));

    const { GET } = await import("@/app/api/users/route");
    const request = new NextRequest("http://localhost/api/users");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockUsers);
  });

  it("should return a 500 Internal Server Error response when the database query fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: {
          permissions: {
            hasUserManagementAccess: true,
            hasResourceAdminAccess: true,
          },
        },
      }),
    }));

    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockRejectedValue(new Error("Database error")),
      },
      users: {},
    }));

    const { GET } = await import("@/app/api/users/route");
    const request = new NextRequest("http://localhost/api/users");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch users");

    consoleErrorSpy.mockRestore();
  });
});
