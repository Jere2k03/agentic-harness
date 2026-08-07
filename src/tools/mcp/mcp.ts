import { McpServerConfig } from "../../config/settings_loader.js";
import { registry } from "../index.js";

export async function registerMcpTools(mcpServers: McpServerConfig[]): Promise<void> {
  for (const server of mcpServers) {
    await registry.registerMcpServer(server);
  }
}