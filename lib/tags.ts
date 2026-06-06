export type PageTagsInput = string | string[] | undefined;

/** Normalize Obsidian-style tags (string or list) into a display-ready array. */
export function normalizeTags(tags: PageTagsInput): string[] | undefined {
  if (tags === undefined) return undefined;

  const list = typeof tags === "string" ? [tags] : tags;
  const normalized = list.map((tag) => tag.trim()).filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}
