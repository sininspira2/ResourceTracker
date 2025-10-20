import fs from "fs";
import path from "path";
import crypto from "crypto";
import { generateMigrationHashes } from "@/scripts/generate-migration-hashes";

jest.mock("fs");

const mockedFs = fs as jest.Mocked<typeof fs>;

describe("generateMigrationHashes script", () => {
  const MIGRATIONS_DIR = "/test/drizzle";
  const OUTPUT_FILE = "/test/lib/migration-hashes.ts";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getExpectedHash = (content: string) => {
    const normalizedContent = content.replace(/\r\n/g, "\n");
    return crypto.createHash("sha256").update(normalizedContent).digest("hex");
  };

  it("should generate correct hashes for given SQL files", () => {
    const sqlFiles = ["0000_test.sql", "0001_another.sql"];
    const sqlContent1 = "CREATE TABLE users;";
    const sqlContent2 = "ALTER TABLE users ADD COLUMN name TEXT;";

    mockedFs.readdirSync.mockReturnValue(sqlFiles as any);
    mockedFs.readFileSync
      .mockReturnValueOnce(sqlContent1)
      .mockReturnValueOnce(sqlContent2);

    generateMigrationHashes(MIGRATIONS_DIR, OUTPUT_FILE);

    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;

    const expectedHash1 = getExpectedHash(sqlContent1);
    const expectedHash2 = getExpectedHash(sqlContent2);

    expect(writtenContent).toContain(`"${expectedHash1}"`);
    expect(writtenContent).toContain(`"${expectedHash2}"`);
  });

  it("should handle no SQL files found", () => {
    mockedFs.readdirSync.mockReturnValue([]);

    generateMigrationHashes(MIGRATIONS_DIR, OUTPUT_FILE);

    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
    expect(writtenContent).toContain(
      "export const MIGRATION_HASHES: string[] = [];",
    );
  });

  it("should normalize line endings before hashing", () => {
    const sqlFiles = ["0000_crlf.sql"];
    const sqlContentCRLF = "SELECT * FROM users;\r\n";
    const sqlContentLF = "SELECT * FROM users;\n";

    mockedFs.readdirSync.mockReturnValue(sqlFiles as any);
    mockedFs.readFileSync.mockReturnValue(sqlContentCRLF);

    generateMigrationHashes(MIGRATIONS_DIR, OUTPUT_FILE);

    const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
    const expectedHash = getExpectedHash(sqlContentLF); // Hash the LF version

    expect(writtenContent).toContain(`"${expectedHash}"`);
  });
});
