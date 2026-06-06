import {
  getPageImage,
  getPageMarkdownUrl,
  resolvePage,
  source,
} from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/docs/page";
import { PageTags } from "@/components/page-tags";
import { ProtectedGate } from "@/components/protected-gate";
import { ViewOptionsPopover } from "@/components/view-options-popover";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getSiteLanguage } from "@/lib/locale";
import { getObsidianUrl } from "@/lib/obsidian";
import {
  hasProtectedAccess,
  isPageProtected,
  isProtectionEnabled,
  pageRequiresAuth,
} from "@/lib/protected";
import { gitConfig } from "@/lib/shared";

export const dynamic = "force-dynamic";

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params;
  const page = resolvePage(params.slug);
  if (!page) notFound();

  const siteLanguage = getSiteLanguage();
  const needsAuth = pageRequiresAuth(page);
  const hasAccess = needsAuth ? await hasProtectedAccess() : true;
  const notConfigured = isPageProtected(page) && !isProtectionEnabled();
  const locked = needsAuth && !hasAccess;
  const MDX = page.data.body;

  return (
    <DocsPage
      toc={locked || notConfigured ? undefined : page.data.toc}
      full={page.data.full}
      tableOfContent={
        locked || notConfigured
          ? undefined
          : {
              style: "clerk",
            }
      }
    >
      <DocsTitle>{page.data.title}</DocsTitle>

      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>

      {page.data.tags && <PageTags tags={page.data.tags} className="" />}

      {!locked && !notConfigured && (
        <div className="flex flex-row gap-2 items-center border-b pb-6">
          <MarkdownCopyButton markdownUrl={getPageMarkdownUrl(page).url} />
          <ViewOptionsPopover
            markdownUrl={getPageMarkdownUrl(page).url}
            obsidianUrl={getObsidianUrl(page.path)}
            obsidianLabel={siteLanguage.openInObsidian}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`}
          />
        </div>
      )}

      <DocsBody>
        {notConfigured ? (
          <p className="text-sm text-fd-muted-foreground">
            {siteLanguage.protectedNotConfigured}
          </p>
        ) : locked ? (
          <ProtectedGate
            description={siteLanguage.protectedDescription}
            passwordLabel={siteLanguage.protectedPassword}
            submitLabel={siteLanguage.protectedSubmit}
            errorMessage={siteLanguage.protectedError}
          />
        ) : (
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams().filter((params) => {
    const page = resolvePage(params.slug);
    return !page || !isPageProtected(page);
  });
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = resolvePage(params.slug);
  if (!page) notFound();

  const needsAuth = pageRequiresAuth(page);
  const hasAccess = needsAuth ? await hasProtectedAccess() : true;

  if (needsAuth && !hasAccess) {
    return {
      title: page.data.title,
      description: page.data.description,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
