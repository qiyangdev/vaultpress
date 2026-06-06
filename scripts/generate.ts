import { fromVault, type ParsedContentFile } from "fumadocs-obsidian";
import fs from "node:fs/promises";
import path from "node:path";

const contentDir = "content";
const preservedFiles = new Set(["index.mdx", "graph.mdx"]);

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

await cleanContentDir();

await fromVault({
  dir: process.env.OBSIDIAN_VAULT_PATH!,
  include: ["**/*", "!.obsidian/**", "!templates/**"],
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
