function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(
  value: string,
  resolveWikilink?: (target: string) => string | null,
) {
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-fd-primary underline underline-offset-2">$1</a>',
  );
  html = html.replace(
    /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g,
    (_, target: string, label?: string) => {
      const text = escapeHtml((label ?? target).trim());
      const href = resolveWikilink?.(target.trim());
      if (!href) return `<span class="text-fd-primary">${text}</span>`;
      return `<a href="${escapeHtml(href)}" class="text-fd-primary underline underline-offset-2">${text}</a>`;
    },
  );

  return html;
}

function isUnorderedListItem(line: string) {
  return /^[-*+]\s+/.test(line);
}

function isOrderedListItem(line: string) {
  return /^\d+\.\s+/.test(line);
}

function isBlockquote(line: string) {
  return /^>\s?/.test(line);
}

function isHeading(line: string) {
  return /^#{1,6}\s+/.test(line);
}

function parseHeading(line: string) {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;
  const level = match[1].length;
  return { level, text: match[2] };
}

function consumeListBlock(
  lines: string[],
  start: number,
  ordered: boolean,
  resolveWikilink?: (target: string) => string | null,
) {
  const items: string[] = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    const match = ordered
      ? line.match(/^\d+\.\s+(.+)$/)
      : line.match(/^[-*+]\s+(.+)$/);
    if (!match) break;
    items.push(renderInline(match[1], resolveWikilink));
    index += 1;
  }

  const tag = ordered ? 'ol' : 'ul';
  const listClass = ordered
    ? 'my-1 list-inside list-decimal space-y-0.5 pl-1'
    : 'my-1 list-inside list-disc space-y-0.5 pl-1';
  return {
    html: `<${tag} class="${listClass}">${items
      .map((item) => `<li>${item}</li>`)
      .join('')}</${tag}>`,
    nextIndex: index,
  };
}

function consumeBlockquote(
  lines: string[],
  start: number,
  resolveWikilink?: (target: string) => string | null,
) {
  const parts: string[] = [];
  let index = start;

  while (index < lines.length) {
    const match = lines[index].match(/^>\s?(.*)$/);
    if (!match) break;
    parts.push(renderInline(match[1], resolveWikilink));
    index += 1;
  }

  return {
    html: `<blockquote class="border-l-2 border-fd-border pl-2 text-fd-muted-foreground">${parts.join('<br />')}</blockquote>`,
    nextIndex: index,
  };
}

export function renderCanvasMarkdown(
  text: string,
  resolveWikilink?: (target: string) => string | null,
) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push('<hr class="my-2 border-fd-border" />');
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      const code = escapeHtml(codeLines.join('\n'));
      const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
      blocks.push(
        `<pre class="my-1 overflow-x-auto rounded-md bg-fd-muted/60 p-2 text-xs"><code${langClass}>${code}</code></pre>`,
      );
      continue;
    }

    if (isHeading(line)) {
      const heading = parseHeading(line);
      if (heading) {
        const tag = `h${heading.level}`;
        blocks.push(
          `<${tag} class="font-semibold leading-snug">${renderInline(heading.text, resolveWikilink)}</${tag}>`,
        );
      }
      index += 1;
      continue;
    }

    if (isBlockquote(line)) {
      const block = consumeBlockquote(lines, index, resolveWikilink);
      blocks.push(block.html);
      index = block.nextIndex;
      continue;
    }

    if (isUnorderedListItem(line)) {
      const block = consumeListBlock(lines, index, false, resolveWikilink);
      blocks.push(block.html);
      index = block.nextIndex;
      continue;
    }

    if (isOrderedListItem(line)) {
      const block = consumeListBlock(lines, index, true, resolveWikilink);
      blocks.push(block.html);
      index = block.nextIndex;
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isHeading(lines[index]) &&
      !isBlockquote(lines[index]) &&
      !isUnorderedListItem(lines[index]) &&
      !isOrderedListItem(lines[index]) &&
      !lines[index].startsWith('```')
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push(
      `<p class="my-0.5">${paragraph
        .map((part) => renderInline(part, resolveWikilink))
        .join('<br />')}</p>`,
    );
  }

  return blocks.join('');
}
