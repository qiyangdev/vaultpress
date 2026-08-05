import fs from 'node:fs/promises';
import path from 'node:path';

function isWithinRoot(root: string, candidate: string) {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/** Resolve a relative path and reject any destination outside the given root. */
export function resolvePathWithin(root: string, relativePath: string) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, relativePath);

  if (!isWithinRoot(resolvedRoot, candidate)) {
    throw new Error(`Path escapes allowed root: ${relativePath}`);
  }

  return candidate;
}

/**
 * Resolve an existing path and follow symlinks before checking its boundary.
 * This prevents an in-root symlink from exposing a file outside the root.
 */
export async function resolveExistingPathWithin(root: string, relativePath: string) {
  const realRoot = await fs.realpath(root);
  const candidate = resolvePathWithin(realRoot, relativePath);
  const realCandidate = await fs.realpath(candidate);

  if (!isWithinRoot(realRoot, realCandidate)) {
    throw new Error(`Path escapes allowed root through a symlink: ${relativePath}`);
  }

  return realCandidate;
}
