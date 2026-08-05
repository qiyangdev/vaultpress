import fs from 'node:fs';
import path from 'node:path';

export type ReadWikilinkTitle = (raw: string) => string | undefined;

/** Build a deterministic, recursive lookup of paths, basenames, and page titles. */
export function buildWikilinkIndex(contentDir: string, readTitle: ReadWikilinkTitle) {
  const map = new Map<string, string>();

  function add(key: string, href: string) {
    const normalized = key.trim().toLowerCase();
    if (normalized && !map.has(normalized)) map.set(normalized, href);
  }

  function walk(dir: string) {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.mdx?$/.test(entry.name)) continue;

      const relative = path.relative(contentDir, fullPath).replace(/\\/g, '/');
      const stem = relative.replace(/\.mdx?$/, '');
      const basename = path.posix.basename(stem);
      const href = stem === 'index' ? '/' : `/${stem}`;

      add(stem, href);
      if (basename !== 'index') add(basename, href);

      const title = readTitle(fs.readFileSync(fullPath, 'utf8'));
      if (title) add(title, href);
    }
  }

  walk(contentDir);
  return map;
}
