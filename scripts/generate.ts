import { checkbox } from "@inquirer/prompts";
import { fromVault, type ParsedContentFile } from "fumadocs-obsidian";
import fs from "node:fs/promises";
import path from "node:path";

const contentDir = "content";
const preservedFiles = new Set(["index.mdx", "graph.mdx"]);
const hiddenEntries = new Set([".obsidian", "templates"]);
const defaultExcludePatterns = ["!.obsidian/**", "!templates/**"];

type VaultEntry = {
  name: string;
  isDirectory: boolean;
};

function resolveTitle(file: ParsedContentFile, fallback: string) {
  const frontmatter = file.frontmatter as Record<string, unknown> | undefined;

  if (typeof frontmatter?.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  const heading = file.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  return fallback;
}

function resolveDescription(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

async function cleanContentDir() {
  let entries;
  try {
    entries = await fs.readdir(contentDir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  await Promise.all(
    entries
      .filter((entry) => !preservedFiles.has(entry.name))
      .map((entry) =>
        fs.rm(path.join(contentDir, entry.name), {
          recursive: true,
          force: true,
        }),
      ),
  );
}

async function listVaultEntries(vaultDir: string): Promise<VaultEntry[]> {
  const entries = await fs.readdir(vaultDir, { withFileTypes: true });

  return entries
    .filter((entry) => !hiddenEntries.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

function printVaultTree(vaultDir: string, entries: VaultEntry[]) {
  console.log(`\nVault: ${vaultDir}\n`);

  if (entries.length === 0) {
    console.log("  (empty)\n");
    return;
  }

  for (const [index, entry] of entries.entries()) {
    const connector = index === entries.length - 1 ? "└── " : "├── ";
    const suffix = entry.isDirectory ? "/" : "";
    console.log(`${connector}${entry.name}${suffix}`);
  }

  console.log("");
}

function parseSavedInclude(value: string | undefined) {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildIncludePatterns(selected: string[], entries: VaultEntry[]) {
  const entryMap = new Map(entries.map((entry) => [entry.name, entry]));
  const patterns: string[] = [];

  for (const name of selected) {
    const entry = entryMap.get(name);
    if (!entry) continue;
    patterns.push(entry.isDirectory ? `${name}/**` : name);
  }

  return [...patterns, ...defaultExcludePatterns];
}

async function saveGenerateInclude(names: string[]) {
  const envPath = path.join(process.cwd(), ".env");
  const line = `GENERATE_INCLUDE=${names.join(",")}`;
  let content = "";

  try {
    content = await fs.readFile(envPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  if (/^GENERATE_INCLUDE=/m.test(content)) {
    content = content.replace(/^GENERATE_INCLUDE=.*$/m, line);
  } else {
    content = content.trimEnd();
    content = content ? `${content}\n${line}\n` : `${line}\n`;
  }

  await fs.writeFile(envPath, content);
}

async function resolveInclude(vaultDir: string) {
  const forceSelect = process.argv.includes("--select");
  const saved = parseSavedInclude(process.env.GENERATE_INCLUDE);
  const entries = await listVaultEntries(vaultDir);

  if (!forceSelect && saved.length > 0) {
    const patterns = buildIncludePatterns(saved, entries);
    if (patterns.length > defaultExcludePatterns.length) {
      console.log(`Using GENERATE_INCLUDE: ${saved.join(", ")}`);
      return patterns;
    }
  }

  if (!process.stdin.isTTY) {
    console.log("Using default include: all top-level items");
    return ["**/*", ...defaultExcludePatterns];
  }

  if (entries.length === 0) {
    console.error("No includable files or folders found in the vault.");
    process.exit(1);
  }

  printVaultTree(vaultDir, entries);

  const selected = await checkbox({
    message: "Select top-level folders and files to include",
    choices: entries.map((entry) => ({
      name: entry.isDirectory ? `${entry.name}/` : entry.name,
      value: entry.name,
      checked: saved.includes(entry.name),
    })),
    validate: (value) => value.length > 0 || "Select at least one item",
  });

  await saveGenerateInclude(selected);
  console.log(`Saved selection to .env as GENERATE_INCLUDE=${selected.join(",")}`);

  return buildIncludePatterns(selected, entries);
}

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

const include = await resolveInclude(vaultDir);

await cleanContentDir();

await fromVault({
  dir: vaultDir,
  include,
  convert: {
    transformFrontmatter(frontmatter, { file }) {
      if (file.format !== "content") return frontmatter;

      const title = resolveTitle(file, String(frontmatter.title ?? ""));
      const description = resolveDescription(frontmatter.description);
      const result: Record<string, unknown> = { ...frontmatter, title };

      if (description) result.description = description;
      else delete result.description;

      return result;
    },
  },
  out: {
    contentDir: `${contentDir}/`,
  },
});
