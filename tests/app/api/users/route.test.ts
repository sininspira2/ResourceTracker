/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock the dependencies using jest.doMock to avoid hoisting issues
jest.doMock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock the db object and its chained methods
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn(),
};

jest.doMock("@/lib/db", () => ({
  db: mockDb,
  users: {
    id: "users.id",
    username: "users.username",
    customNickname: "users.customNickname",
    createdAt: "users.createdAt",
    lastLogin: "users.lastLogin",
  },
}));

describe("GET /api/users", () => {
  let GET: (req: NextRequest) => Promise<Response>;
  let getServerSession: jest.Mock;
  let users: any;
  const mockRequest = new NextRequest("http://localhost/api/users");
  const mockUsers = [
    {
      id: "1",
      username: "testuser",
      customNickname: "Test User",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    // Reset modules to ensure mocks are fresh for each test
    jest.resetModules();

    // Dynamically import the route handler after mocks are established
    const route = await import("@/app/api/users/route");
    GET = route.GET;

    const nextAuth = await import("next-auth");
    getServerSession = nextAuth.getServerSession as jest.Mock;

    const dbModule = await import("@/lib/db");
    users = dbModule.users;

    // Clear mocks before each test
    getServerSession.mockClear();
    (mockDb.select as jest.Mock).mockClear();
    (mockDb.from as jest.Mock).mockClear();

    // Default mock behavior for chained db calls
    (mockDb.select as jest.Mock).mockReturnThis();
  });

  test("should return 403 Forbidden if there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  test("should return 403 Forbidden if user lacks required permissions", async () => {
    getServerSession.mockResolvedValue({
      user: {
        permissions: {
          hasUserManagementAccess: false,
          hasResourceAdminAccess: false,
        },
      },
    });

    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  test("should return 200 and users if user has hasUserManagementAccess", async () => {
    getServerSession.mockResolvedValue({
      user: {
        permissions: {
          hasUserManagementAccess: true,
          hasResourceAdminAccess: false,
        },
      },
    });
    (mockDb.from as jest.Mock).mockResolvedValue(mockUsers);

    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockUsers);
    expect(mockDb.select).toHaveBeenCalledWith({
      id: users.id,
      username: users.username,
      customNickname: users.customNickname,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin,
    });
    expect(mockDb.from).toHaveBeenCalledWith(users);
  });

  test("should return 200 and users if user has hasResourceAdminAccess", async () => {
    getServerSession.mockResolvedValue({
      user: {
        permissions: {
          hasUserManagementAccess: false,
          hasResourceAdminAccess: true,
        },
      },
    });
    (mockDb.from as jest.Mock).mockResolvedValue(mockUsers);

    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockUsers);
  });

  test("should return 500 if the database query fails", async () => {
    getServerSession.mockResolvedValue({
      user: {
        permissions: {
          hasUserManagementAccess: true,
        },
      },
    });
    (mockDb.from as jest.Mock).mockRejectedValue(
      new Error("Database connection error"),
    );

    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch users");
  });
});
