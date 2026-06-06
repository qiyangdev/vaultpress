import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";

type PageTagsProps = {
  tags: string[];
  className?: string;
};

export function PageTags({ tags, className }: PageTagsProps) {
  if (tags.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2 list-none p-0 m-0", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className={cn(
            buttonVariants({ color: "outline", size: "sm" }),
            "cursor-default",
          )}
        >
          #{tag}
        </li>
      ))}
    </ul>
  );
}
