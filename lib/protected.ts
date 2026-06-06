import { createHmac, timingSafeEqual } from "node:crypto";
import type { Node, Root } from "fumadocs-core/page-tree";
import { cookies } from "next/headers";
import { resolvePage, source } from "@/lib/source";

export const PROTECTED_COOKIE = "vaultpress-protected";

type SourcePage = ReturnType<typeof source.getPages>[number];

export function isProtectionEnabled() {
  return Boolean(process.env.SITE_PROTECT_PASSWORD?.trim());
}

export function isPageProtected(page: { data: { protected?: boolean } }) {
  return page.data.protected === true;
}

export function pageRequiresAuth(page: { data: { protected?: boolean } }) {
  return isPageProtected(page) && isProtectionEnabled();
}

export function getAuthToken() {
  const password = process.env.SITE_PROTECT_PASSWORD?.trim();
  if (!password) return null;

  return createHmac("sha256", password)
    .update("vaultpress-protected")
    .digest("hex");
}

export function verifyPassword(input: string) {
  const expected = process.env.SITE_PROTECT_PASSWORD ?? "";
  if (!expected) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function hasProtectedAccess() {
  const token = getAuthToken();
  if (!token) return false;

  const cookieStore = await cookies();
  return cookieStore.get(PROTECTED_COOKIE)?.value === token;
}

function isProtectedUrl(url: string) {
  const page = source.getPages().find((entry) => entry.url === url);
  return page ? pageRequiresAuth(page) : false;
}

function filterNodes(nodes: Node[], hasAccess: boolean): Node[] {
  const filtered: Node[] = [];

  for (const node of nodes) {
    if (node.type === "page") {
      if (!hasAccess && isProtectedUrl(node.url)) continue;
      filtered.push(node);
      continue;
    }

    if (node.type === "folder") {
      const children = filterNodes(node.children, hasAccess);
      const index =
        node.index && (!hasAccess && isProtectedUrl(node.index.url) ? undefined : node.index);

      if (children.length === 0 && !index) continue;

      filtered.push({ ...node, children, index });
      continue;
    }

    filtered.push(node);
  }

  return filtered;
}

export function filterPageTree(tree: Root, hasAccess: boolean): Root {
  if (hasAccess) return tree;

  return {
    ...tree,
    children: filterNodes(tree.children, hasAccess),
  };
}

export function getAccessiblePages(hasAccess: boolean) {
  return source.getPages().filter((page) => hasAccess || !pageRequiresAuth(page));
}

export function isProtectedSlug(slug?: string[]) {
  if (!slug || slug.length === 0) return false;

  const page = resolvePage(slug);
  return page ? pageRequiresAuth(page) : false;
}

export function getSlugFromContentPath(pathname: string) {
  if (pathname.startsWith("/llms.mdx/") && pathname.endsWith("/content.md")) {
    const inner = pathname.slice("/llms.mdx/".length, -"/content.md".length);
    return inner.split("/").filter(Boolean);
  }

  if (pathname.endsWith(".md") && !pathname.startsWith("/llms.mdx")) {
    return pathname.slice(1, -3).split("/").filter(Boolean);
  }

  return null;
}

export type { SourcePage };
