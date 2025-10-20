import { db } from "@/lib/db";

describe("Database Connection", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should throw an error if TURSO_DATABASE_URL is not provided", () => {
    delete process.env.TURSO_DATABASE_URL;
    // We need to access a property on the proxied 'db' object to trigger initialization
    expect(() => db.select).toThrow(
      "TURSO_DATABASE_URL environment variable not provided.",
    );
  });

  it("should not throw an error if TURSO_DATABASE_URL is provided", () => {
    process.env.TURSO_DATABASE_URL = "file:test.db";
    // Accessing a property should now work without throwing
    expect(() => db.select).not.toThrow();
  });
});
