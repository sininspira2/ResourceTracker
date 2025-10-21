/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/user/data-deletion/route";
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
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
  resourceHistory: {
    updatedBy: "updatedBy",
    reason: "reason",
  },
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedHasResourceAccess = hasResourceAccess as jest.Mock;
const mockedDb = db as jest.Mocked<typeof db>;

describe("POST /api/user/data-deletion", () => {
  let request: NextRequest;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    const url = "http://localhost/api/user/data-deletion";
    request = new NextRequest(url, { method: "POST" });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 401 Unauthorized if there is no session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 Unauthorized if the user lacks resource access", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { roles: ["guest"] } });
    mockedHasResourceAccess.mockReturnValue(false);
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should anonymize user data and return a success message", async () => {
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

    const mockRecords = [{ id: 1 }, { id: 2 }];
    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(mockRecords),
    });

    (mockedDb.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue({ rowCount: 2 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Data deletion request processed successfully");
    expect(body.recordsAffected).toBe(2);
    expect(body.method).toBe("anonymization");
  });

  it("should handle cases where the user has no data to anonymize", async () => {
    const mockSession = {
      user: { id: "user-456", roles: ["contributor"] },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    });

    (mockedDb.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue({ rowCount: 0 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.recordsAffected).toBe(0);
  });

  it("should return a 500 error if the database query fails", async () => {
    const mockSession = {
      user: { id: "user-789", roles: ["contributor"] },
    };
    mockedGetServerSession.mockResolvedValue(mockSession);
    mockedHasResourceAccess.mockReturnValue(true);

    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockRejectedValue(new Error("DB connection failed")),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to process deletion request");
  });
});
