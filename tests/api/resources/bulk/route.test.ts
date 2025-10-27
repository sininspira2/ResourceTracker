/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import Papa from "papaparse";

// Note: Top-level jest.mock calls are hoisted, but we'll override them
// with jest.doMock inside each test for isolation.
jest.mock("next-auth");
jest.mock("@/lib/discord-roles");
jest.mock("@/lib/db");

describe("GET /api/resources/bulk", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should correctly filter for subcategory=None", async () => {
    const mockWhere = jest.fn().mockResolvedValue([
      {
        id: "1",
        name: "Resource with Null Sub",
        subcategory: null,
        quantityHagga: 1,
        quantityDeepDesert: 1,
        targetQuantity: 1,
      },
    ]);

    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: mockWhere,
        }),
      },
      resources: {
        subcategory: "resources.subcategory",
        tier: "resources.tier",
        isPriority: "resources.isPriority",
        updatedAt: "resources.updatedAt",
      },
    }));

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: { roles: ["Target Editor"] },
      }),
    }));

    jest.doMock("@/lib/discord-roles", () => ({
      hasTargetEditAccess: jest.fn().mockReturnValue(true),
    }));

    const { GET } = await import("@/app/api/resources/bulk/route");

    const request = new NextRequest(
      "http://localhost/api/resources/bulk?subcategory=None",
    );
    const response = await GET(request);
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true });

    expect(response.status).toBe(200);
    expect(parsed.data).toHaveLength(1);
    expect((parsed.data[0] as any).name).toBe("Resource with Null Sub");

    expect(mockWhere).toHaveBeenCalled();
  });
});

describe("POST /api/resources/bulk", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  async function setupPostMocks() {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: { roles: ["Target Editor"] },
      }),
    }));

    jest.doMock("@/lib/discord-roles", () => ({
      hasTargetEditAccess: jest.fn().mockReturnValue(true),
    }));

    const { POST } = await import("@/app/api/resources/bulk/route");
    return POST;
  }

  it("should return 400 for invalid file type", async () => {
    const POST = await setupPostMocks();
    const formData = new FormData();
    formData.append(
      "file",
      new File(["content"], "test.txt", { type: "text/plain" }),
    );

    const request = new NextRequest("http://localhost/api/resources/bulk", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid file type. Please upload a .csv file.");
  });

  it("should return 400 for file size exceeding the limit", async () => {
    const POST = await setupPostMocks();
    const largeContent = "a".repeat(257 * 1024);
    const formData = new FormData();
    formData.append(
      "file",
      new File([largeContent], "large.csv", { type: "text/csv" }),
    );

    const request = new NextRequest("http://localhost/api/resources/bulk", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("File size exceeds the 256KB limit.");
  });
});
