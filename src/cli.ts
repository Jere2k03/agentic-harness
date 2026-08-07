#!/usr/bin/env node
import { AnthropicAdapter, ContextManager, Validator, Logger, HarnessEngine, registry } from "./lib.js";
import "./tools/function_calling/function_calling.js";
import * as mcp from "./tools/mcp/mcp.js";
import * as paths from "./config/paths.js";
import * as settingsLoader from "./config/settings_loader.js";
import * as fs from "fs";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({ input: stdin, output: stdout });

const setupFolderExisted = paths.ensurePathSetup();

if (!setupFolderExisted) {
  console.log("Welcome to the Agentic Harness! It looks like this is your first time running the application.\n");
}

const { config: setupConfig, apiKeySet } = settingsLoader.loadConfig();

if (!apiKeySet) {
  const apiKey = await rl.question("Please enter your API key: ");
  setupConfig.llm.apiKey = apiKey.trim();
  fs.writeFileSync(paths.CONFIG_FILE_PATH, JSON.stringify(setupConfig, null, 2));
}

//register mcp tools
const mcpServers = setupConfig.mcp || [];
await mcp.registerMcpTools(mcpServers);

const systemPrompt = settingsLoader.loadSystemPrompt();
const adapter = new AnthropicAdapter(setupConfig.llm);
const context = new ContextManager();
const validator = new Validator();
const logger = new Logger();

const engine = new HarnessEngine(systemPrompt, adapter, registry, validator, logger, context);

console.log("Chat started. Type 'exit' to quit.\n");

while (true) {
  const userInput = await rl.question("User: ");

  if (userInput.trim().toLowerCase() === "exit") {
    break;
  }

  const answer = await engine.run_agent_loop(userInput);
  console.log("Assistant:", answer, "\n");
}

rl.close();