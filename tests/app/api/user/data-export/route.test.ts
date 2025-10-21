/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/user/data-export/route";
import { getServerSession } from "next-auth";
import { hasResourceAccess } from "@/lib/discord-roles";
import { db } from "@/lib/db";

// Mock dependencies
jest.mock("next-auth");
jest.mock("@/lib/discord-roles");
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn(),
  },
  resourceHistory: {},
  resources: {},
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedHasResourceAccess = hasResourceAccess as jest.Mock;
const mockedDb = db as jest.Mocked<typeof db>;

describe("GET /api/user/data-export", () => {
  let request: NextRequest;

  beforeEach(() => {
    jest.resetAllMocks();
    const url = "http://localhost/api/user/data-export";
    request = new NextRequest(url);
  });

  it("should return 401 Unauthorized if there is no session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 Unauthorized if the user lacks resource access", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { roles: ["guest"] } });
    mockedHasResourceAccess.mockReturnValue(false);
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return a JSON file with user data on successful export", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        roles: ["contributor"],
      },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    const mockActivity = [
      {
        id: 1,
        resourceName: "Resource A",
        changeAmountHagga: 10,
        changeAmountDeepDesert: 5,
        changeType: "relative",
        createdAt: new Date().toISOString(),
      },
    ];
    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockActivity),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Content-Disposition")).toContain(
      "attachment; filename=",
    );
    expect(body.user.id).toBe("user-123");
    expect(body.resourceActivity.length).toBe(1);
    expect(body.summary.totalChanges).toBe(1);
  });

  it("should handle a successful export for a user with no activity", async () => {
    const mockSession = {
      user: { id: "user-456", roles: ["contributor"] },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.resourceActivity.length).toBe(0);
    expect(body.summary.totalChanges).toBe(0);
  });

  it("should return a 500 error if the database query fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockSession = {
      user: { id: "user-789", roles: ["contributor"] },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockRejectedValue(new Error("DB connection failed")),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to export user data");

    consoleErrorSpy.mockRestore();
  });
});
