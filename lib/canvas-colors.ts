import type { CanvasColor } from './canvas-types';

const PRESET_COLORS: Record<string, string> = {
  '1': '#e93147',
  '2': '#e9835e',
  '3': '#e0b400',
  '4': '#86bd00',
  '5': '#08bdba',
  '6': '#a882ff',
};

const PRESET_BACKGROUNDS: Record<string, string> = {
  '1': '#fce8eb',
  '2': '#fdf0e8',
  '3': '#fdf8e0',
  '4': '#f0f8e0',
  '5': '#e0f8f8',
  '6': '#f0ecff',
};

export function resolveCanvasColor(color?: CanvasColor) {
  if (!color) return undefined;
  if (color.startsWith('#')) return color;
  return PRESET_COLORS[color] ?? undefined;
}

export function canvasColorStyle(color?: CanvasColor) {
  const resolved = resolveCanvasColor(color);
  if (!resolved) return undefined;
  return { borderColor: resolved, color: resolved };
}

export function canvasNodeStyle(color?: CanvasColor) {
  if (!color) {
    return { backgroundColor: 'var(--color-fd-background)' };
  }

  const borderColor = resolveCanvasColor(color);
  if (!borderColor) {
    return { backgroundColor: 'var(--color-fd-background)' };
  }

  const backgroundColor = PRESET_BACKGROUNDS[color]
    ?? `color-mix(in oklab, ${borderColor} 14%, var(--color-fd-background))`;

  return { borderColor, backgroundColor };
}
