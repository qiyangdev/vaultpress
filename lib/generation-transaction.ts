import fs from 'node:fs/promises';
import path from 'node:path';

export type DirectoryReplacement = {
  target: string;
  replacement: string;
};

type ReplacementState = DirectoryReplacement & {
  backup: string;
  hadTarget: boolean;
  installed: boolean;
};

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Replace a set of sibling output directories as one recoverable transaction.
 * Existing targets are retained as backups until every replacement is installed.
 */
export async function replaceDirectories(replacements: DirectoryReplacement[]) {
  if (replacements.length === 0) return;

  const resolved = replacements.map(({ target, replacement }) => ({
    target: path.resolve(target),
    replacement: path.resolve(replacement),
  }));
  const targetParents = new Set(resolved.map(({ target }) => path.dirname(target)));
  const targetNames = new Set(resolved.map(({ target }) => target));

  if (targetParents.size !== 1) {
    throw new Error('Transactional directory targets must share the same parent');
  }
  if (targetNames.size !== resolved.length) {
    throw new Error('Transactional directory targets must be unique');
  }

  for (const { replacement } of resolved) {
    const stats = await fs.stat(replacement);
    if (!stats.isDirectory()) {
      throw new Error(`Replacement is not a directory: ${replacement}`);
    }
  }

  const parent = [...targetParents][0];
  const backupRoot = await fs.mkdtemp(path.join(parent, '.vaultpress-backup-'));
  const states: ReplacementState[] = resolved.map((entry, index) => ({
    ...entry,
    backup: path.join(backupRoot, String(index)),
    hadTarget: false,
    installed: false,
  }));
  let cleanupBackup = false;

  try {
    for (const state of states) {
      if (await pathExists(state.target)) {
        await fs.rename(state.target, state.backup);
        state.hadTarget = true;
      }
    }

    for (const state of states) {
      await fs.rename(state.replacement, state.target);
      state.installed = true;
    }

    cleanupBackup = true;
  } catch (error) {
    const rollbackErrors: unknown[] = [];

    for (const state of [...states].reverse()) {
      try {
        if (state.installed) {
          await fs.rm(state.target, { recursive: true, force: true });
        }
        if (state.hadTarget) {
          await fs.rename(state.backup, state.target);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `Failed to publish generated output and roll it back; backups remain at ${backupRoot}`,
      );
    }

    cleanupBackup = true;
    throw error;
  } finally {
    if (cleanupBackup) {
      await fs.rm(backupRoot, { recursive: true, force: true });
    }
  }
}
