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

  it("should include a read-only tier column with the human-readable label", async () => {
    const mockWhere = jest.fn().mockResolvedValue([
      {
        id: "r1",
        name: "Steel Plate",
        tier: 3,
        subcategory: null,
        quantityHagga: 0,
        quantityDeepDesert: 0,
        targetQuantity: 10,
      },
      {
        id: "r2",
        name: "Burning Blades",
        tier: 10,
        subcategory: null,
        quantityHagga: 0,
        quantityDeepDesert: 0,
        targetQuantity: 5,
      },
      {
        id: "r3",
        name: "No Tier",
        tier: null,
        subcategory: null,
        quantityHagga: 0,
        quantityDeepDesert: 0,
        targetQuantity: 0,
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
    expect((parsed.data[0] as any).tier).toBe("Tier 3 (Steel)");
    expect((parsed.data[1] as any).tier).toBe("Grade 4");
    expect((parsed.data[2] as any).tier).toBe("");
  });

  it("should expand 'Gear Blueprints' category filter to also match legacy 'Blueprints' DB rows", async () => {
    const capturedInArrayArgs: unknown[][] = [];

    jest.doMock("drizzle-orm", () => {
      const actual = jest.requireActual("drizzle-orm");
      return {
        ...actual,
        inArray: jest.fn((...args: unknown[]) => {
          capturedInArrayArgs.push(args as unknown[]);
          return (actual as any).inArray(...args);
        }),
      };
    });

    const mockWhere = jest.fn().mockResolvedValue([]);

    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          where: mockWhere,
        }),
      },
      resources: {
        category: "resources.category",
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
      "http://localhost/api/resources/bulk?category=Gear+Blueprints",
    );
    await GET(request);

    // The category inArray call should include both the new and legacy names
    const categoryInArrayCall = capturedInArrayArgs.find(
      (args) =>
        Array.isArray(args[1]) &&
        (args[1] as string[]).includes("Gear Blueprints"),
    );
    expect(categoryInArrayCall).toBeDefined();
    const filterValues = categoryInArrayCall![1] as string[];
    expect(filterValues).toContain("Gear Blueprints");
    expect(filterValues).toContain("Blueprints");
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

  it("should return 400 when required columns are missing from the CSV", async () => {
    const POST = await setupPostMocks();
    // CSV that has no 'id' or 'quantityHagga' columns
    const csvContent = "name,quantityDeepDesert\nResource 1,0";
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

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/missing required columns/);
    expect(body.error).toContain("id");
    expect(body.error).toContain("quantityHagga");
  });

  it("should not strip a lone apostrophe to an empty string on import", async () => {
    // A row whose id is exactly "'" should remain "'" (not collapse to ""),
    // so it is treated as not_found rather than silently matching nothing.
    const csvContent = [
      "id,name,quantityHagga,quantityDeepDesert,targetQuantity",
      "',Some Name,10,0,",
    ].join("\n");

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: { roles: ["Target Editor"] },
      }),
    }));
    jest.doMock("@/lib/discord-roles", () => ({
      hasTargetEditAccess: jest.fn().mockReturnValue(true),
    }));
    jest.doMock("@/lib/db", () => ({
      db: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
          // inArray with an empty array → no resources found
          where: jest.fn().mockResolvedValue([]),
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
    // Should succeed (200) with the row marked not_found, not crash with a 500
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].status).toBe("not_found");
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
