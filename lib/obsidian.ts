function toVaultRelativePath(contentPath: string) {
  return contentPath.replace(/\.mdx?$/i, ".md");
}

export function getObsidianUrl(contentPath: string) {
  const params = new URLSearchParams({
    file: toVaultRelativePath(contentPath),
  });

  return `obsidian://open?${params.toString()}`;
}
