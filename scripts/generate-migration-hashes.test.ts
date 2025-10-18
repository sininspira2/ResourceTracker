import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const TEST_DIR = path.join(process.cwd(), "temp-test-drizzle");
const SCRIPT_PATH = path.join(process.cwd(), "scripts", "generate-migration-hashes.ts");
const OUTPUT_FILE = path.join(process.cwd(), "lib", "migration-hashes.ts");

describe("generate-migration-hashes script", () => {
  let originalOutputFileContent = "";
  let originalScriptContent = "";

  beforeAll(() => {
    if (fs.existsSync(OUTPUT_FILE)) {
      originalOutputFileContent = fs.readFileSync(OUTPUT_FILE, "utf-8");
    }
    originalScriptContent = fs.readFileSync(SCRIPT_PATH, "utf-8");
  });

  afterAll(() => {
    if (originalOutputFileContent) {
      fs.writeFileSync(OUTPUT_FILE, originalOutputFileContent, "utf-8");
    } else if (fs.existsSync(OUTPUT_FILE)) {
      fs.unlinkSync(OUTPUT_FILE);
    }
    fs.writeFileSync(SCRIPT_PATH, originalScriptContent, "utf-8");
  });

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR);
    // Modify the script to point to our temporary directory
    const modifiedScriptContent = originalScriptContent.replace(
      'path.join(process.cwd(), "drizzle")',
      `path.join(process.cwd(), "temp-test-drizzle")`
    );
    fs.writeFileSync(SCRIPT_PATH, modifiedScriptContent, "utf-8");
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    // Restore original script content after each test
    fs.writeFileSync(SCRIPT_PATH, originalScriptContent, "utf-8");
  });

  const getExpectedHash = (content: string) => {
    const normalizedContent = content.replace(/\r\n/g, "\n");
    return crypto.createHash("sha256").update(normalizedContent).digest("hex");
  };

  it("should generate correct hashes for given SQL files", () => {
    const sqlContent1 = "CREATE TABLE users;";
    const sqlContent2 = "ALTER TABLE users ADD COLUMN name TEXT;";
    fs.writeFileSync(path.join(TEST_DIR, "0000_test.sql"), sqlContent1);
    fs.writeFileSync(path.join(TEST_DIR, "0001_another.sql"), sqlContent2);

    execSync(`npx tsx ${SCRIPT_PATH}`);

    const generatedContent = fs.readFileSync(OUTPUT_FILE, "utf-8");
    const expectedHash1 = getExpectedHash(sqlContent1);
    const expectedHash2 = getExpectedHash(sqlContent2);

    expect(generatedContent).toContain(`"${expectedHash1}"`);
    expect(generatedContent).toContain(`"${expectedHash2}"`);
  });

  it("should handle no SQL files found", () => {
    execSync(`npx tsx ${SCRIPT_PATH}`);
    const generatedContent = fs.readFileSync(OUTPUT_FILE, "utf-8");
    expect(generatedContent).toContain("export const MIGRATION_HASHES: string[] = [];");
  });

  it("should normalize line endings before hashing", () => {
    const sqlContentCRLF = "SELECT * FROM users;\r\n";
    const sqlContentLF = "SELECT * FROM users;\n";
    fs.writeFileSync(path.join(TEST_DIR, "0000_crlf.sql"), sqlContentCRLF);

    execSync(`npx tsx ${SCRIPT_PATH}`);

    const generatedContent = fs.readFileSync(OUTPUT_FILE, "utf-8");
    const expectedHash = getExpectedHash(sqlContentLF); // Hash the LF version

    expect(generatedContent).toContain(`"${expectedHash}"`);
  });
});