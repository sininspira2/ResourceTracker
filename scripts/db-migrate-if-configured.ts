import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (!process.env.TURSO_DATABASE_URL) {
  console.error(
    "release:migrate requires TURSO_DATABASE_URL to be set. Refusing to skip migrations.",
  );
  process.exit(1);
}

const drizzleKitBin = resolve("node_modules", ".bin", "drizzle-kit");
if (!existsSync(drizzleKitBin)) {
  console.error(
    `drizzle-kit binary not found at ${drizzleKitBin}. Run npm install first.`,
  );
  process.exit(1);
}

const result = spawnSync(drizzleKitBin, ["migrate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("Failed to spawn drizzle-kit:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
