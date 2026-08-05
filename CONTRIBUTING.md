# Contributing

Thanks for your interest in VaultPress.

## Development setup

1. Clone the repository and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment file and set your Obsidian vault path:

   ```bash
   cp .env.example .env
   ```

3. Generate content from your vault:

   ```bash
   pnpm generate
   ```

   `pnpm generate` builds output in a temporary staging directory and replaces `content/` and `public/` only after every generation step succeeds. It preserves `content/index.mdx` and `content/graph.mdx`. See [Generation rules](README.md#generation-rules) in `README.md` for the full replacement scope.

4. Start the development server:

   ```bash
   pnpm dev
   ```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm generate` | Stage notes, media, and Canvas files, then atomically replace `content/` and `public/` |
| `pnpm obsidian` | Open the configured vault in Obsidian |
| `pnpm types:check` | Run MDX generation, Next.js typegen, and TypeScript |
| `pnpm lint` | Run Oxlint |

## Pull requests

1. Create a branch from `main`
2. Keep changes focused and consistent with the existing code style
3. Run `pnpm types:check` and `pnpm build` before opening a PR
4. Describe what changed and why in the PR description

## Reporting issues

Please include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node.js version and operating system
