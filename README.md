# 🕹️ agentic-harness

**A small, adapter-based TypeScript harness for building tool-using LLM agents.**

Swap out model providers, register tools with a single call, and let a minimal agent loop
handle the request → tool-call → tool-result → response cycle for you.

[![npm version](https://img.shields.io/npm/v/%40jere2k03%2Fagentic-harness.svg)](https://www.npmjs.com/package/@jere2k03/agentic-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Status: WIP](https://img.shields.io/badge/status-work--in--progress-orange.svg)](#status)

---

## What is this?

`agentic-harness` is a lightweight framework that strips an LLM agent down to its
essential moving parts:

- **Adapter** — translates a provider-agnostic request/response shape to and from a specific
  LLM API (an `AnthropicAdapter` ships out of the box).
- **ToolRegistry** — a single place to register tools, whatever backs them: a local
  function, an MCP server, or generated code.
- **ContextManager** — keeps the running conversation history.
- **Validator** — checks tool calls against the registry (unknown tool name, missing
  required parameters) before execution and drives a bounded retry loop.
- **Logger** — structured, timestamped trace of every step in a run (request sent, response
  received, validation result, tool dispatch/result, retries, loop end).
- **HarnessEngine** — drives the actual agent loop: send request → get text or a tool call →
  validate → execute the tool → feed the result back → repeat until the model returns text.

It's intentionally small and readable rather than batteries-included — a good starting
point if you want to understand how an agent loop works under the hood, or to build your
own harness on top of it.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  CLI (index) │───▶│   HarnessEngine   │◀───▶│   Adapter    │──▶ Anthropic API
└─────────────┘     │  (agent loop)     │     └──────────────┘
                     │        │          │
                     │        ▼          │
                     │  ┌────────────┐   │
                     │  │ContextMgr  │   │
                     │  └────────────┘   │
                     │        │          │
                     │        ▼          │
                     │  ┌────────────┐   │
                     │  │ Validator  │   │
                     │  └────────────┘   │
                     │        │          │
                     │        ▼          │
                     │  ┌────────────┐   │
                     │  │ToolRegistry│───┼──▶ function_call / mcp / code_gen
                     │  └────────────┘   │
                     │        │          │
                     │        ▼          │
                     │  ┌────────────┐   │
                     │  │  Logger    │   │
                     │  └────────────┘   │
                     └──────────────────┘
```

| Module | Path | Responsibility |
|---|---|---|
| `HarnessEngine` | `src/engine/engine.ts` | Runs the request/tool-call loop |
| `Validator` | `src/engine/validation.ts` | Tool-call validation & retry decisions |
| `Adapter` | `src/adapter/adapter.ts` | Provider-agnostic LLM interface |
| `AnthropicAdapter` | `src/adapter/anthropic.ts` | Anthropic Messages API implementation |
| `ContextManager` | `src/context/manager.ts` | In-memory conversation history |
| `ToolRegistry` | `src/tools/registry.ts` | Tool registration & dispatch |
| `Logger` | `src/traceability/logging.ts` | Structured run/trace logging |
| `paths` / `settings_loader` | `src/config/` | Global config file locations, load/validate config |

## Status

This is an early-stage, experimental project. The Anthropic adapter,
`function_call`-backed tools, `Validator`, and `Logger` are functional and covered by
tests. The `mcp` and `code_gen` tool execution paths are currently stubs. Expect breaking
changes.

## Getting started

### Prerequisites

- Node.js ≥ 20
- An [Anthropic API key](https://console.anthropic.com/)

Unlike a typical `.env`-based CLI, `agentic-harness` stores its configuration **globally**,
outside of any project directory, so the command works the same no matter where you run it
from.

### Option A: Use the CLI (no install needed)

```bash
npx @jere2k03/agentic-harness
```

Or install it globally:

```bash
npm install -g @jere2k03/agentic-harness
agentic-harness
```

**First run:** the CLI creates `~/.agentic-harness/` (containing `config.json` and
`SYSTEM.md`) if it doesn't exist yet, prints a short welcome message, and — if no API key
is set — prompts you for one interactively and saves it to `config.json`. From then on it
just starts the chat.

```
Welcome to the Agentic Harness! It looks like this is your first time running the application.

Please enter your API key: sk-ant-...
Chat started. Type 'exit' to quit.

User: what's the weather in Berlin?
Assistant: Right then, Berlin's a bit grim today — 7°C and rainy, innit.
```

### Configuration

All settings live in `~/.agentic-harness/`:

| File | Purpose |
|---|---|
| `config.json` | `apiKey`, `model`, `max_tokens` |
| `SYSTEM.md` | The system prompt used for every conversation |

Edit either file directly and restart the CLI to pick up changes — no rebuild needed.
`config.json` defaults to:

```json
{
  "apiKey": "YOUR_API_KEY_HERE",
  "model": "claude-haiku-4-5",
  "max_tokens": 1024
}
```

### Option B: Use it as a library

```bash
npm install @jere2k03/agentic-harness
```

```ts
import {
  AnthropicAdapter,
  ContextManager,
  Validator,
  Logger,
  ToolRegistry,
  HarnessEngine,
} from "@jere2k03/agentic-harness";

const adapter = new AnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: "claude-haiku-4-5",
  max_tokens: 1024,
});
const context = new ContextManager();
const registry = new ToolRegistry();
const validator = new Validator();
const logger = new Logger();

const systemPrompt = "You are a helpful assistant.";
const engine = new HarnessEngine(systemPrompt, adapter, registry, validator, logger, context);

const answer = await engine.run_agent_loop("what's the weather in Berlin?");
console.log(answer);
```

Register your own tools on the `ToolRegistry` before running the loop — see
[Registering a tool](#registering-a-tool) below.

### Option C: Clone and run from source (for contributing)

```bash
git clone https://github.com/Jere2k03/agentic-harness.git
cd agentic-harness
npm install
npm run build
npm link
agentic-harness   # first run walks you through setup, see above
```

`npm link` makes the `agentic-harness` command available globally on your machine, backed
by your local checkout — rebuild with `npm run build` after changes. To remove it later:
`npm unlink -g agentic-harness`.

## Registering a tool

Tools are registered on the shared `registry` and are immediately available to the agent
loop. Here's the built-in example (`src/tools/function_calling.ts`):

```ts
import { registry } from "./index.js";

registry.registerNewTool(
  {
    name: "get_weather",
    description: "Get the current weather for a given city",
    parameters: {
      city: { type: "string", description: "Name of the city", required: true },
    },
  },
  "function_call",
  {
    handler: async (params) => `7°C, rainy in ${params.city}`,
  },
);
```

Three execution types are supported by the registry's shape today:

- `function_call` — run a local async handler *(implemented)*
- `mcp` — delegate to a remote MCP server tool *(planned)*
- `code_gen` — have the model generate and execute code *(planned)*

Every tool call is validated by the `Validator` before execution — unknown tool names or
missing required parameters are turned into a retry, up to a fixed attempt limit, with the
failure reason fed back to the model.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the CLI with hot reload (`tsx watch`) — for development, not interactive chat sessions |
| `npm run chat` | Run the CLI once, without watch mode — use this for an actual chat session |
| `npm run build` | Type-check and compile to `dist/` |
| `npm test` | Run the test suite (`vitest`) |
| `npm run lint` | Lint `src/` with ESLint |

## Roadmap

Actively developed. See internal roadmap for the full plan — current focus areas:

- Real MCP client + code-execution sandbox (currently stubs)
- Second model adapter (proving true provider-agnosticism)
- CLI flags (`--model`, `--max-tokens`, one-shot `-p "prompt"` mode)
- A proper terminal UI (beyond the current line-based chat)
- Sub-agents as a registry execution type

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on
how to get set up, coding conventions, and how to submit a pull request.

## License

Distributed under the [MIT License](LICENSE).