import * as fs from "fs";
import * as paths from "./paths.js";

export type McpServerConfig =
  | { transport: "stdio"; name: string; command: string; args: string[] }
  | { transport: "http"; name: string; serverUrl: string };

export interface SetupConfig {
  llm: {
    apiKey: string;
    model: string;
    max_tokens: number;
  };
  
  mcp: McpServerConfig[];
}

export interface LoadConfigResult {
  config: SetupConfig;
  apiKeySet: boolean;
}

export function loadConfig(): LoadConfigResult {
  const configContent = fs.readFileSync(paths.CONFIG_FILE_PATH, "utf-8");
  const config: SetupConfig = JSON.parse(configContent);

  const apiKeySet = !!config.llm.apiKey && config.llm.apiKey !== "YOUR_API_KEY_HERE";

  return { config, apiKeySet };
}

export function loadSystemPrompt(): string {
  return fs.readFileSync(paths.SYSTEM_PROMPT_FILE_PATH, "utf-8");
}