import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";

const vaultDir = process.env.OBSIDIAN_VAULT_PATH;

if (!vaultDir) {
  console.error("OBSIDIAN_VAULT_PATH is not set. Add it to .env.");
  process.exit(1);
}

try {
  await fs.access(vaultDir);
} catch {
  console.error(`Obsidian vault not found: ${vaultDir}`);
  process.exit(1);
}

const result = spawnSync("open", ["-a", "Obsidian", vaultDir], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
