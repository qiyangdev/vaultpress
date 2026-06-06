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
import { ViewOptionsPopover } from "@/components/view-options-popover";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getSiteLanguage } from "@/lib/locale";
import { getObsidianUrl } from "@/lib/obsidian";
import { gitConfig } from "@/lib/shared";

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params;
  const page = resolvePage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const obsidianUrl = getObsidianUrl(page.path);
  const { openInObsidian } = getSiteLanguage();
  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{
        style: "clerk",
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>

      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>

      {page.data.tags && <PageTags tags={page.data.tags} className="" />}

      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          obsidianUrl={obsidianUrl}
          obsidianLabel={openInObsidian}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`}
        />
      </div>

      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = resolvePage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
