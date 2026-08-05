import {
  convertVaultFiles,
  readVaultFiles,
  type OutputFile,
  type ParsedContentFile,
} from "fumadocs-obsidian";
import { generateCanvasPages, syncCanvasFromVault } from "./generate-canvas-pages.ts";
import {
  promptIncludeSelection,
  type VaultEntry,
} from "./generate-select-ui.ts";
import {
  createStepProgress,
  GenerateProgress,
  runWithGenerateUi,
} from "./progress.ts";
import { replaceDirectories } from "../lib/generation-transaction.ts";
import { resolvePathWithin } from "../lib/safe-path.ts";
import fs from "node:fs/promises";
import path from "node:path";

const contentDir = "content";
const publicDir = "public";
const preservedFiles = new Set(["index.mdx", "graph.mdx"]);
const hiddenEntries = new Set([".obsidian", "templates"]);
const defaultExcludePatterns = ["!.obsidian/**", "!templates/**"];

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

async function prepareStagedOutput(
  stagedContentDir: string,
  stagedPublicDir: string,
  step: ReturnType<typeof createStepProgress>,
) {
  await Promise.all([
    fs.mkdir(stagedContentDir, { recursive: true }),
    fs.mkdir(stagedPublicDir, { recursive: true }),
  ]);

  step.start(preservedFiles.size);
  let preserved = 0;

  for (const file of preservedFiles) {
    try {
      await fs.copyFile(path.join(contentDir, file), path.join(stagedContentDir, file));
      preserved += 1;
      step.advance(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      step.advance(`${file} (missing)`);
    }
  }

  step.complete(`Preserved ${preserved} hand-written file${preserved === 1 ? "" : "s"}`);
}

async function writeVaultOutputs(
  files: OutputFile[],
  stagedContentDir: string,
  stagedPublicDir: string,
  step: ReturnType<typeof createStepProgress>,
) {
  const targetDirs: Record<OutputFile["type"], string> = {
    asset: stagedPublicDir,
    content: stagedContentDir,
    data: stagedContentDir,
    custom: "",
  };

  if (files.length === 0) {
    step.skip("No files to write");
    return;
  }

  step.start(files.length);
  for (const file of files) {
    if (file.type === "custom") {
      throw new Error(`Cannot publish custom output atomically: ${file.path}`);
    }
    const mappedPath = resolvePathWithin(targetDirs[file.type], file.path);
    await fs.mkdir(path.dirname(mappedPath), { recursive: true });
    await fs.writeFile(mappedPath, file.content);
    step.advance(file.path);
  }
  step.complete(`Wrote ${files.length} file${files.length === 1 ? "" : "s"}`);
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

  const selected = await promptIncludeSelection(vaultDir, entries, saved);

  await saveGenerateInclude(selected);
  console.log(`\nSaved selection to .env as GENERATE_INCLUDE=${selected.join(",")}`);

  return buildIncludePatterns(selected, entries);
}

async function main() {
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
  const stagingRoot = await fs.mkdtemp(path.join(process.cwd(), ".vaultpress-stage-"));
  const stagedContentDir = path.join(stagingRoot, "content");
  const stagedPublicDir = path.join(stagingRoot, "public");

  const progress = new GenerateProgress([
    { id: "prepare", label: "Preparing staged output" },
    { id: "convert", label: "Converting vault" },
    { id: "write", label: "Writing files" },
    { id: "canvas-sync", label: "Syncing canvas assets" },
    { id: "canvas-pages", label: "Generating canvas pages" },
    { id: "publish", label: "Publishing generated output" },
  ]);

  try {
    await runWithGenerateUi(progress, async () => {
      const prepare = createStepProgress(progress, "prepare");
      const convert = createStepProgress(progress, "convert");
      const write = createStepProgress(progress, "write");
      const canvasSync = createStepProgress(progress, "canvas-sync");
      const canvasPages = createStepProgress(progress, "canvas-pages");
      const publish = createStepProgress(progress, "publish");

      await prepareStagedOutput(stagedContentDir, stagedPublicDir, prepare);

      convert.start(0);
      convert.setDetail("Reading vault files...");
      const rawFiles = await readVaultFiles({ dir: vaultDir, include });
      convert.setDetail(
        `Found ${rawFiles.length} file${rawFiles.length === 1 ? "" : "s"}. Converting...`,
      );

      const outputs = await convertVaultFiles(rawFiles, {
        transformFrontmatter(frontmatter, { file }) {
          if (file.format !== "content") return frontmatter;

          const title = resolveTitle(file, String(frontmatter.title ?? ""));
          const description = resolveDescription(frontmatter.description);
          const result: Record<string, unknown> = { ...frontmatter, title };

          if (description) result.description = description;
          else delete result.description;

          return result;
        },
      });

      convert.complete(
        `Converted ${rawFiles.length} file${rawFiles.length === 1 ? "" : "s"}`,
      );

      await writeVaultOutputs(outputs, stagedContentDir, stagedPublicDir, write);
      await syncCanvasFromVault(vaultDir, include, canvasSync, {
        publicDir: stagedPublicDir,
      });
      await generateCanvasPages(canvasPages, {
        contentDir: stagedContentDir,
        publicDir: stagedPublicDir,
      });

      publish.start(1);
      publish.setDetail("Replacing content/ and public/...");
      await replaceDirectories([
        { target: contentDir, replacement: stagedContentDir },
        { target: publicDir, replacement: stagedPublicDir },
      ]);
      publish.advance();
      publish.complete("Published both output directories");
    });
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  if (error instanceof Error && error.message === "Selection cancelled") {
    console.error("Generate cancelled.");
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});
