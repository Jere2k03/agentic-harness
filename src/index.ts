#!/usr/bin/env node
import { AnthropicAdapter, ContextManager, Validator, Logger, HarnessEngine, registry } from "./lib.js";
import "./tools/function_calling.js";
import dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

dotenv.config();

const adapter = new AnthropicAdapter(process.env["ANTHROPIC_API_KEY"]!);
const context = new ContextManager();
const validator = new Validator();
const logger = new Logger();

const engine = new HarnessEngine(adapter, registry, validator, logger, context);

const rl = readline.createInterface({ input: stdin, output: stdout });

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