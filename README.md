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
- **HarnessEngine** — drives the actual agent loop: send request → get text or a tool call →
  execute the tool → feed the result back → repeat until the model returns text.

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
                     │  │ToolRegistry│───┼──▶ function_call / mcp / code_gen
                     │  └────────────┘   │
                     └──────────────────┘
```

| Module | Path | Responsibility |
|---|---|---|
| `HarnessEngine` | `src/engine/engine.ts` | Runs the request/tool-call loop |
| `Validator` | `src/engine/validation.ts` | Response/tool-call validation *(stub, WIP)* |
| `Adapter` | `src/adapter/adapter.ts` | Provider-agnostic LLM interface |
| `AnthropicAdapter` | `src/adapter/anthropic.ts` | Anthropic Messages API implementation |
| `ContextManager` | `src/context/manager.ts` | In-memory conversation history |
| `ToolRegistry` | `src/tools/registry.ts` | Tool registration & dispatch |
| `Logger` | `src/traceability/logging.ts` | Run/trace logging *(stub, WIP)* |

## Status

This is an early-stage, experimental project. The Anthropic adapter and
`function_call`-backed tools are functional; the `mcp` and `code_gen` tool execution paths,
`Validator`, and `Logger` are currently stubs. Expect breaking changes.

## Getting started

### Prerequisites

- Node.js ≥ 20
- An [Anthropic API key](https://console.anthropic.com/)

Either way, set your API key in the environment first:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Option A: Use the CLI (no install needed)

```bash
npx @jere2k03/agentic-harness
```

Or install it globally:

```bash
npm install -g @jere2k03/agentic-harness
agentic-harness
```

You'll get an interactive CLI chat. Type `exit` to quit.

```
Chat started. Type 'exit' to quit.

User: what's the weather in Berlin?
Assistant: Right then, Berlin's a bit grim today — 7°C and rainy, innit.
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

const adapter = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!);
const context = new ContextManager();
const registry = new ToolRegistry();
const validator = new Validator();
const logger = new Logger();

const engine = new HarnessEngine(adapter, registry, validator, logger, context);

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
cp .env.example .env   # then edit .env and set ANTHROPIC_API_KEY
npm run dev
```

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

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the CLI with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm test` | Run the test suite (`vitest`) |
| `npm run lint` | Lint `src/` with ESLint |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on
how to get set up, coding conventions, and how to submit a pull request.

## License

Distributed under the [MIT License](LICENSE).
