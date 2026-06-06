"use client";

import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "fumadocs-ui/components/ui/popover";
import { useTranslations } from "fumadocs-ui/contexts/i18n";
import { ChevronDown, ExternalLinkIcon, TextIcon } from "lucide-react";
import type { ComponentProps } from "react";

type ViewOptionsPopoverProps = ComponentProps<typeof PopoverTrigger> & {
  markdownUrl?: string;
  githubUrl?: string;
  obsidianUrl?: string;
  obsidianLabel?: string;
};

function ObsidianIcon() {
  return (
    <svg fill="currentColor" role="img" viewBox="0 0 24 24">
      <title>Obsidian</title>
      <path d="M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z" />
    </svg>
  );
}

export function ViewOptionsPopover({
  markdownUrl,
  githubUrl,
  obsidianUrl,
  obsidianLabel = "Open in Obsidian",
  ...props
}: ViewOptionsPopoverProps) {
  const t = useTranslations();

  const items = [
    obsidianUrl && {
      title: obsidianLabel,
      href: obsidianUrl,
      icon: <ObsidianIcon />,
    },
    githubUrl && {
      title: t.pageActionsOpenGitHub,
      href: githubUrl,
      icon: (
        <svg fill="currentColor" role="img" viewBox="0 0 24 24">
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
    markdownUrl && {
      title: t.pageActionsViewMarkdown,
      href: markdownUrl,
      icon: <TextIcon />,
    },
  ].filter((item) => !!item);

  if (items.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        {...props}
        className={cn(
          buttonVariants({
            color: "secondary",
            size: "sm",
          }),
          "gap-2 data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground",
          props.className,
        )}
      >
        {props.children ?? t.pageActionsOpen}
        <ChevronDown className="size-3.5 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col">
        {items.map((item) => {
          const external = !item.href.startsWith("obsidian://");

          return (
            <a
              key={item.href}
              href={item.href}
              rel={external ? "noreferrer noopener" : undefined}
              target={external ? "_blank" : undefined}
              className="text-sm p-2 rounded-lg inline-flex items-center gap-2 hover:text-fd-accent-foreground hover:bg-fd-accent [&_svg]:size-4"
            >
              {item.icon}
              {item.title}
              <ExternalLinkIcon className="text-fd-muted-foreground size-3.5 ms-auto" />
            </a>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
