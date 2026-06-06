export type CanvasFileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'markdown'
  | 'other';

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
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
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
