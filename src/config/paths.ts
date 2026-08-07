import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// config for agent setup
export const homeDir: string = os.homedir(); // Get the user's home directory using the 'os' module (cross-platform)
export const SETUP_FOLDER_NAME = ".agentic-harness"; // Define the name of the setup folder
export const SETUP_FOLDER_PATH = path.join(homeDir, SETUP_FOLDER_NAME); // Construct the full path to the setup folder in the user's home directory
export const CONFIG_FILE_NAME = "config.json"; // Define the name of the configuration file
export const SYSTEM_PROMPT_FILE_NAME = "SYSTEM.md"; // Define the name of the system prompt file

export const CONFIG_FILE_PATH = path.join(SETUP_FOLDER_PATH, CONFIG_FILE_NAME);
export const SYSTEM_PROMPT_FILE_PATH = path.join(SETUP_FOLDER_PATH, SYSTEM_PROMPT_FILE_NAME);

export const DEFAULT_CONFIG_TEMPLATE = JSON.stringify(
  {
    llm: {
      apiKey: "YOUR_API_KEY_HERE",
      model: "claude-haiku-4-5",
      max_tokens: 1024,
    },
    mcp: [],
  },
  null,
  2,
);

export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `
# System Prompt

You are a helpful agent.
`;

// Ensure the setup folder and necessary files exist, creating them with default content if they don't (return true if folder already exists, false if it was created)
export function ensurePathSetup(): boolean {
  let setupFolderExists: boolean;
  // Ensure the setup folder exists, creating it if necessary
  if (!fs.existsSync(SETUP_FOLDER_PATH)) {
    fs.mkdirSync(SETUP_FOLDER_PATH, { recursive: true });
    setupFolderExists = false;
  }
  else {
    setupFolderExists = true;
  }

  // Ensure the configuration file exists, creating it with default content if necessary
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    fs.writeFileSync(CONFIG_FILE_PATH, DEFAULT_CONFIG_TEMPLATE);
  }

  // Ensure the system prompt file exists, creating it with default content if necessary
  if (!fs.existsSync(SYSTEM_PROMPT_FILE_PATH)) {
    fs.writeFileSync(SYSTEM_PROMPT_FILE_PATH, DEFAULT_SYSTEM_PROMPT_TEMPLATE);
  }
  return setupFolderExists;
}