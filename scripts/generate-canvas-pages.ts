import { readVaultFiles } from 'fumadocs-obsidian';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getCanvasFileKind, normalizeCanvasPath } from '../lib/canvas-paths.ts';
import { parseCanvasData } from '../lib/load-canvas.ts';
import {
  resolveExistingPathWithin,
  resolvePathWithin,
} from '../lib/safe-path.ts';
import type { CanvasData } from '../lib/canvas-types.ts';
import type { StepProgress } from './progress.ts';

const contentDir = 'content';
const publicDir = 'public';

type CanvasOutputDirs = {
  contentDir?: string;
  publicDir?: string;
};

function collectCanvasAssetPaths(data: CanvasData) {
  const paths = new Set<string>();

  for (const node of data.nodes) {
    if (node.type === 'file' && getCanvasFileKind(node.file) !== 'markdown') {
      paths.add(normalizeCanvasPath(node.file));
    }
    if (node.type === 'group' && node.background) {
      paths.add(normalizeCanvasPath(node.background));
    }
  }

  return paths;
}

async function copyVaultFile(
  vaultDir: string,
  outputPublicDir: string,
  relativePath: string,
) {
  const normalized = normalizeCanvasPath(relativePath);
  let source: string;

  try {
    source = await resolveExistingPathWithin(vaultDir, normalized);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    console.warn(`Canvas asset not found in vault: ${normalized}`);
    return false;
  }

  const destination = resolvePathWithin(outputPublicDir, normalized);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
  return true;
}

export async function syncCanvasFromVault(
  vaultDir: string,
  include: string[],
  step?: StepProgress,
  output: CanvasOutputDirs = {},
) {
  const outputPublicDir = output.publicDir ?? publicDir;
  const vaultFiles = await readVaultFiles({ dir: vaultDir, include });
  const canvasFiles = vaultFiles
    .map((file) => file.path)
    .filter((file) => file.endsWith('.canvas'));
  const assetPaths = new Set<string>();

  for (const relativePath of canvasFiles) {
    const normalized = normalizeCanvasPath(relativePath);
    try {
      const canvasPath = await resolveExistingPathWithin(vaultDir, normalized);
      const raw = await fs.readFile(canvasPath, 'utf8');
      for (const asset of collectCanvasAssetPaths(parseCanvasData(raw))) {
        assetPaths.add(asset);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      console.warn(`Canvas file not found in vault: ${normalized}`);
    }
  }

  const copyQueue = [
    ...new Set([
      ...canvasFiles.map((file) => normalizeCanvasPath(file)),
      ...assetPaths,
    ]),
  ];

  if (copyQueue.length === 0) {
    step?.skip('No canvas files to sync');
    return { canvasCount: canvasFiles.length, assetCount: 0 };
  }

  step?.start(copyQueue.length);
  let copiedAssets = 0;

  for (const relativePath of copyQueue) {
    if (await copyVaultFile(vaultDir, outputPublicDir, relativePath)) {
      if (!relativePath.endsWith('.canvas')) copiedAssets += 1;
      step?.advance(relativePath);
    }
  }

  step?.complete(
    `Synced ${canvasFiles.length} canvas file${canvasFiles.length === 1 ? '' : 's'} and ${copiedAssets} asset${copiedAssets === 1 ? '' : 's'}`,
  );

  return {
    canvasCount: canvasFiles.length,
    assetCount: copiedAssets,
  };
}

function humanizeCanvasTitle(name: string) {
  const stem = name.replace(/\.canvas$/i, '');
  return stem
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function findCanvasFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
          return;
        }
        if (entry.name.endsWith('.canvas')) {
          results.push(fullPath);
        }
      }),
    );
  }

  await walk(dir);
  return results.sort();
}

function toContentPath(
  publicPath: string,
  outputPublicDir: string,
  outputContentDir: string,
) {
  const relative = path.relative(outputPublicDir, publicPath).replace(/\\/g, '/');
  const slug = relative.replace(/\.canvas$/i, '');
  return path.join(outputContentDir, `${slug}.mdx`);
}

function toPublicSrc(publicPath: string, outputPublicDir: string) {
  const relative = path.relative(outputPublicDir, publicPath).replace(/\\/g, '/');
  return `/${relative}`;
}

function buildCanvasMdx(title: string, src: string) {
  return `---
title: ${JSON.stringify(title)}
description: Obsidian Canvas
full: true
---

import { CanvasPageContent } from "@/components/canvas-page";

<CanvasPageContent src=${JSON.stringify(src)} />
`;
}

export async function generateCanvasPages(
  step?: StepProgress,
  output: CanvasOutputDirs = {},
) {
  const outputContentDir = output.contentDir ?? contentDir;
  const outputPublicDir = output.publicDir ?? publicDir;
  let files: string[] = [];

  try {
    files = await findCanvasFiles(outputPublicDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }

  if (files.length === 0) {
    step?.skip('No canvas pages to generate');
    return 0;
  }

  step?.start(files.length);

  for (const filePath of files) {
    const title = humanizeCanvasTitle(path.basename(filePath));
    const contentPath = toContentPath(filePath, outputPublicDir, outputContentDir);
    const src = toPublicSrc(filePath, outputPublicDir);
    await fs.mkdir(path.dirname(contentPath), { recursive: true });
    await fs.writeFile(contentPath, buildCanvasMdx(title, src));
    step?.advance(path.relative(outputPublicDir, filePath).replace(/\\/g, '/'));
  }

  step?.complete(
    `Generated ${files.length} canvas page${files.length === 1 ? '' : 's'}`,
  );

  return files.length;
}
