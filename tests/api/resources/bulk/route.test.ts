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

  it("should sanitize formula-injection characters in exported CSV fields", async () => {
    const mockWhere = jest.fn().mockResolvedValue([
      {
        id: "safe-id",
        name: "=DANGEROUS()",
        subcategory: null,
        quantityHagga: 10,
        quantityDeepDesert: 5,
        targetQuantity: 20,
      },
      {
        id: "safe-id-2",
        name: "+also dangerous",
        subcategory: null,
        quantityHagga: 1,
        quantityDeepDesert: 0,
        targetQuantity: null,
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
    const request = new NextRequest("http://localhost/api/resources/bulk");
    const response = await GET(request);
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true });

    expect(response.status).toBe(200);
    // Fields starting with formula chars must be prefixed with a single quote
    expect((parsed.data[0] as any).name).toBe("'=DANGEROUS()");
    expect((parsed.data[1] as any).name).toBe("'+also dangerous");
    // Safe id is unchanged
    expect((parsed.data[0] as any).id).toBe("safe-id");
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

  it("should desanitize quote-prefixed IDs and names on import", async () => {
    // Simulate a CSV that was exported with sanitized fields and re-saved by an
    // editor that preserved the leading single-quote verbatim (e.g. LibreOffice).
    const csvContent = [
      "id,name,quantityHagga,quantityDeepDesert,targetQuantity",
      "'resource-1,'=Resource Name,100,0,200",
    ].join("\n");

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: { roles: ["Target Editor"], name: "Test User", email: "t@t.com" },
      }),
    }));

    jest.doMock("@/lib/discord-roles", () => ({
      hasTargetEditAccess: jest.fn().mockReturnValue(true),
    }));

    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([
            // The DB record uses the real ID (without the quote prefix)
            {
              id: "resource-1",
              name: "=Resource Name",
              quantityHagga: 50,
              quantityDeepDesert: 0,
              targetQuantity: 200,
            },
          ]),
        }),
      },
      resources: { id: "resources.id" },
    }));

    const { POST } = await import("@/app/api/resources/bulk/route");
    const formData = new FormData();
    formData.append(
      "file",
      new File([csvContent], "resources.csv", { type: "text/csv" }),
    );

    const request = new NextRequest("http://localhost/api/resources/bulk", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    // The resource should be found (not "not_found"), confirming ID desanitization worked
    const row = body[0];
    expect(row.id).toBe("resource-1");
    expect(row.status).not.toBe("not_found");
  });

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
