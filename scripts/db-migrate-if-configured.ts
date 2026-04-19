import { spawnSync } from "node:child_process";

if (!process.env.TURSO_DATABASE_URL) {
  console.warn(
    "Skipping drizzle-kit migrate: TURSO_DATABASE_URL is not set (likely CI/build check).",
  );
  process.exit(0);
}

const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
