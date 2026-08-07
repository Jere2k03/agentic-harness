import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
    command: "/Users/jeremiasmatt/Projekte/powerplatform-mcp/node_modules/.bin/tsx",
    args: ["/Users/jeremiasmatt/Projekte/powerplatform-mcp/src/index.ts"]
});

const clientInstance = new Client(
    {name: "Agentic Harness", version: "1.0.1"},
    {capabilities: {}}
);

const client = await clientInstance.connect(transport);
console.log(JSON.stringify(client, null, 2));

const tools = await clientInstance.listTools();
console.log(JSON.stringify(tools, null, 2));

await clientInstance.close();