import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { normalizeCanvasPath } from '../lib/canvas-paths.ts';
import { replaceDirectories } from '../lib/generation-transaction.ts';
import {
  resolveExistingPathWithin,
  resolvePathWithin,
} from '../lib/safe-path.ts';
import { getAuthorizedSearchUrl } from '../lib/search-access.ts';
import { buildWikilinkIndex } from '../lib/wikilink-index.ts';

test('unauthenticated search cannot select the protected index', () => {
  const url = getAuthorizedSearchUrl(
    'https://example.com/api/search?query=secret&tag=protected',
    false,
  );

  assert.equal(url.searchParams.get('tag'), 'public');
  assert.equal(url.searchParams.get('query'), 'secret');
});

test('authenticated search preserves an explicitly selected tag', () => {
  const url = getAuthorizedSearchUrl(
    'https://example.com/api/search?tag=protected',
    true,
  );

  assert.equal(url.searchParams.get('tag'), 'protected');
});

test('canvas paths normalize safe relative paths', () => {
  assert.equal(normalizeCanvasPath('./folder\\image.png'), 'folder/image.png');
  assert.equal(normalizeCanvasPath('folder//nested/./note.md'), 'folder/nested/note.md');
});

test('canvas paths reject traversal and absolute path forms', () => {
  for (const unsafe of [
    '../secret.txt',
    'folder/../../secret.txt',
    '/etc/passwd',
    'C:\\Windows\\system.ini',
    '\\\\server\\share\\secret.txt',
    '',
  ]) {
    assert.throws(() => normalizeCanvasPath(unsafe), /Unsafe canvas path/);
  }
});

test('resolved write paths remain inside their allowed root', () => {
  const root = path.join(os.tmpdir(), 'vaultpress-public');
  assert.equal(
    resolvePathWithin(root, 'images/example.png'),
    path.join(root, 'images/example.png'),
  );
  assert.throws(() => resolvePathWithin(root, '../package.json'), /escapes allowed root/);
});

test('existing paths cannot escape through a symlink', async (t) => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vaultpress-path-test-'));
  const vaultRoot = path.join(temporaryRoot, 'vault');
  const outsideRoot = path.join(temporaryRoot, 'outside');

  t.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));

  await fs.mkdir(vaultRoot);
  await fs.mkdir(outsideRoot);
  await fs.writeFile(path.join(outsideRoot, 'secret.txt'), 'secret');
  await fs.symlink(outsideRoot, path.join(vaultRoot, 'linked'));

  await assert.rejects(
    resolveExistingPathWithin(vaultRoot, 'linked/secret.txt'),
    /escapes allowed root through a symlink/,
  );
});

test('generated directories replace old output only after staging succeeds', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vaultpress-transaction-test-'));
  const content = path.join(root, 'content');
  const publicDir = path.join(root, 'public');
  const stagedContent = path.join(root, 'staged-content');
  const stagedPublic = path.join(root, 'staged-public');

  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await Promise.all([
    fs.mkdir(content),
    fs.mkdir(publicDir),
    fs.mkdir(stagedContent),
    fs.mkdir(stagedPublic),
  ]);
  await fs.writeFile(path.join(content, 'stale.mdx'), 'stale');
  await fs.writeFile(path.join(publicDir, 'stale.png'), 'stale');
  await fs.writeFile(path.join(stagedContent, 'fresh.mdx'), 'fresh');
  await fs.writeFile(path.join(stagedPublic, 'fresh.png'), 'fresh');

  await replaceDirectories([
    { target: content, replacement: stagedContent },
    { target: publicDir, replacement: stagedPublic },
  ]);

  assert.equal(await fs.readFile(path.join(content, 'fresh.mdx'), 'utf8'), 'fresh');
  assert.equal(await fs.readFile(path.join(publicDir, 'fresh.png'), 'utf8'), 'fresh');
  await assert.rejects(fs.access(path.join(content, 'stale.mdx')), { code: 'ENOENT' });
});

test('failed directory publication restores every previous target', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vaultpress-rollback-test-'));
  const content = path.join(root, 'content');
  const publicDir = path.join(root, 'public');
  const sharedReplacement = path.join(root, 'replacement');

  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await Promise.all([fs.mkdir(content), fs.mkdir(publicDir), fs.mkdir(sharedReplacement)]);
  await fs.writeFile(path.join(content, 'old-content.mdx'), 'old content');
  await fs.writeFile(path.join(publicDir, 'old-public.png'), 'old public');
  await fs.writeFile(path.join(sharedReplacement, 'new.mdx'), 'new');

  await assert.rejects(
    replaceDirectories([
      { target: content, replacement: sharedReplacement },
      { target: publicDir, replacement: sharedReplacement },
    ]),
    { code: 'ENOENT' },
  );

  assert.equal(
    await fs.readFile(path.join(content, 'old-content.mdx'), 'utf8'),
    'old content',
  );
  assert.equal(
    await fs.readFile(path.join(publicDir, 'old-public.png'), 'utf8'),
    'old public',
  );
});

test('wikilink index discovers nested pages by path, basename, and title', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vaultpress-wikilink-test-'));
  const nested = path.join(root, 'permanent', 'nested');

  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await fs.mkdir(nested, { recursive: true });
  await fs.writeFile(path.join(root, 'index.mdx'), '---\ntitle: Home\n---\n');
  await fs.writeFile(
    path.join(nested, 'Atomic Note.mdx'),
    '---\ntitle: A Deep Idea\n---\n',
  );

  const index = buildWikilinkIndex(root, (raw) => raw.match(/^title:\s*(.+)$/m)?.[1]);

  assert.equal(index.get('home'), '/');
  assert.equal(index.get('permanent/nested/atomic note'), '/permanent/nested/Atomic Note');
  assert.equal(index.get('atomic note'), '/permanent/nested/Atomic Note');
  assert.equal(index.get('a deep idea'), '/permanent/nested/Atomic Note');
});
