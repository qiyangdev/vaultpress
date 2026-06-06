/** Normalize Obsidian-style protected flags (boolean or string) into a boolean. */
export function normalizeProtected(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value || undefined;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
  }

  return undefined;
}
