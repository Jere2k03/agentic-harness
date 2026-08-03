# Contributing to agentic-harness

Thanks for your interest in improving `agentic-harness`! This project is small and
early-stage, so there's plenty of room to shape it — bug fixes, new adapters, new tool
execution types, docs, and tests are all welcome.

## Getting set up

```bash
git clone https://github.com/Jere2k03/agentic-harness.git
cd agentic-harness
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

## Development workflow

1. **Fork** the repo and create a branch off `main`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Make your change.
3. Run the checks locally before opening a PR:
   ```bash
   npm run lint
   npm run build
   npm test
   ```
4. Commit using clear, descriptive messages (imperative mood, e.g. `Add MCP tool execution`).
5. Push your branch and open a pull request against `main`.

## Coding conventions

- **TypeScript, strict mode.** The project builds with `strict: true` — don't weaken this.
- **ESM imports.** Use explicit `.js` extensions on relative imports (NodeNext module
  resolution), matching the existing files.
- **Keep modules focused.** Each piece (`adapter`, `engine`, `context`, `tools`,
  `traceability`) has one job — put new code where it belongs rather than adding
  cross-cutting logic to `HarnessEngine`.
- **No unnecessary abstractions.** Prefer the simplest implementation that solves the
  problem in front of you.
- Run `npm run lint` and fix warnings before submitting.

## Adding a new adapter

Implement the `Adapter` interface (`src/adapter/adapter.ts`):

```ts
export interface Adapter {
  sendRequest(request: AdapterRequest): Promise<AdapterResponse>;
}
```

Translate the provider's request/response shape to/from `AdapterRequest` /
`AdapterResponse` (see `src/adapter/anthropic.ts` for a reference implementation), and
handle at least the equivalents of `end_turn`, `tool_use`, and truncation.

## Adding a new tool execution type

Tool dispatch lives in `src/tools/registry.ts`. The `mcp` and `code_gen` execution paths
are currently stubs (`executeTool` returns a placeholder string) — implementing either is
a great first contribution. Register example usage in `src/tools/` following the pattern
in `function_calling.ts`.

## Reporting bugs / requesting features

Please open a [GitHub issue](https://github.com/Jere2k03/agentic-harness/issues) with:

- What you expected to happen vs. what actually happened
- Steps to reproduce (a minimal snippet is ideal)
- Your Node.js version and OS

## Pull request checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] The PR description explains the *why*, not just the *what*
- [ ] New behavior has test coverage where practical

## Code of conduct

Be respectful and constructive. Assume good faith, keep discussions focused on the
technical merits, and help keep this a welcoming project for first-time contributors.
