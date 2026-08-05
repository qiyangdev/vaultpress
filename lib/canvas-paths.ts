export type CanvasFileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'markdown'
  | 'other';

const WINDOWS_DRIVE_PATH = /^[a-zA-Z]:/;

const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
]);

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']);

export function normalizeCanvasPath(filePath: string) {
  const slashNormalized = filePath.replace(/\\/g, '/');

  if (
    !slashNormalized ||
    slashNormalized.includes('\0') ||
    slashNormalized.startsWith('/') ||
    WINDOWS_DRIVE_PATH.test(slashNormalized)
  ) {
    throw new Error(`Unsafe canvas path: ${filePath}`);
  }

  const segments = slashNormalized
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.');

  if (segments.length === 0 || segments.some((segment) => segment === '..')) {
    throw new Error(`Unsafe canvas path: ${filePath}`);
  }

  return segments.join('/');
}

function getExtension(filePath: string) {
  const index = filePath.lastIndexOf('.');
  if (index === -1) return '';
  return filePath.slice(index).toLowerCase();
}

export function getCanvasFileKind(filePath: string): CanvasFileKind {
  const ext = getExtension(filePath);
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (ext === '.pdf') return 'pdf';
  if (/\.(md|mdx)$/i.test(filePath)) return 'markdown';
  return 'other';
}

export function isCanvasImagePath(filePath: string) {
  return getCanvasFileKind(filePath) === 'image';
}

export function resolveCanvasAssetUrl(assetPath: string) {
  return `/${normalizeCanvasPath(assetPath)}`;
}

export function getCanvasFileExtensionLabel(filePath: string) {
  const ext = getExtension(filePath);
  return ext ? ext.slice(1).toUpperCase() : 'FILE';
}
