import { ToolDefinition } from "../adapter/config.js";
import { McpServerConfig } from "../config/settings_loader.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Define the types for different execution methods of tools
type ExecutionType = "mcp" | "code_gen" | "function_call";
type FunctionHandler = (params: Record<string, unknown>) => Promise<string>;
type ToolCaller =
  | { type: "mcp"; client: Client; remoteName: string }
  | { type: "code_gen"; params: FunctionHandler }
  | { type: "function_call"; params: FunctionHandler };

// Define the structure of a registered tool, including its definition, execution type, and caller information
interface RegisteredTool {
  def: ToolDefinition;
  execType: ExecutionType;
  caller: ToolCaller;
}

// Translate a single MCP tool description into our internal ToolDefinition format
function convertMcpToolToDefinition(mcpTool: {
  name: string;
  description?: string;
  inputSchema: {
    properties?: Record<string, unknown>;
    required?: string[];
  };
}): ToolDefinition {
  const properties = (mcpTool.inputSchema.properties ?? {}) as Record<string, { type: string; description?: string }>;
  const requiredKeys = new Set(mcpTool.inputSchema.required ?? []);

  const parameters: ToolDefinition["parameters"] = {};
  for (const [key, val] of Object.entries(properties)) {
    parameters[key] = {
      type: val.type,
      description: val.description ?? "",
      required: requiredKeys.has(key),
    };
  }

  return {
    name: mcpTool.name,
    description: mcpTool.description ?? "",
    parameters,
  };
}

// Define the ToolRegistry class that manages the registration and execution of tools
export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  // Register a new tool with its definition and handler function (function_call / code_gen only — MCP has its own method)
  registerNewTool(
    definition: ToolDefinition,
    executionType: Exclude<ExecutionType, "mcp">,
    options: { handler?: FunctionHandler }
  ) {
    switch (executionType) {
      case "function_call":
        if (!options.handler) throw new Error("function_call braucht einen handler");
        this.registerFunctionTool(definition, options.handler);
        break;
      case "code_gen":
        this.registerCodeGenTool(definition);
        break;
    }
  }

  // Register a new tool that is executed via a function call
  private registerFunctionTool(definition: ToolDefinition, handler: FunctionHandler) {
    this.tools.set(definition.name, { def: definition, execType: "function_call", caller: { type: "function_call", params: handler } });
  }

  // Register a new tool that is executed via code generation
  private registerCodeGenTool(definition: ToolDefinition) {
    this.tools.set(definition.name, { def: definition, execType: "code_gen", caller: { type: "code_gen", params: async (params: Record<string, unknown>) => "" } });
  }

  // Connect to an MCP server, list its tools, and register every tool it offers
  async registerMcpServer(config: McpServerConfig): Promise<void> {
    const transport =
      config.transport === "stdio"
        ? new StdioClientTransport({ command: config.command, args: config.args })
        : new StreamableHTTPClientTransport(new URL(config.serverUrl));

    const client = new Client({ name: "agentic-harness", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);

    const { tools } = await client.listTools();

    for (const mcpTool of tools) {
      const definition = convertMcpToolToDefinition(mcpTool);
      this.tools.set(definition.name, {
        def: definition,
        execType: "mcp",
        caller: { type: "mcp", client, remoteName: mcpTool.name },
      });
    }
  }

  // Retrieve the definition of a registered tool for the AdapterRequest
  getToolList(): ToolDefinition[] {
    const toolList: ToolDefinition[] = [];
    for (const [, tool] of this.tools.entries()) {
      toolList.push(tool.def);
    }
    return toolList;
  }

  // Retrieve a registered tool by its name
  getRegisteredTool(name: string): Promise<RegisteredTool | undefined> {
    return Promise.resolve(this.tools.get(name));
  }

  // Execute a registered tool with the provided parameters
  async executeTool(name: string, params: Record<string, unknown>): Promise<string> {
    const registeredTool = this.tools.get(name);
    if (!registeredTool) {
      throw new Error(`Tool ${name} is not registered.`);
    }

    switch (registeredTool.caller.type) {
      case "function_call":
        return registeredTool.caller.params(params);

      case "mcp": {
        const result = await registeredTool.caller.client.callTool({
          name: registeredTool.caller.remoteName,
          arguments: params,
        });
        const content = result.content as Array<{ type: string; text?: string }>;
        const textBlock = content.find((block) => block.type === "text");
        return textBlock?.text ?? "";
      }

      case "code_gen":
        // Implement code generation logic here
        return Promise.resolve(`Code generation for tool ${name}`);

      default:
        throw new Error(`Unknown execution type for tool ${name}.`);
    }
  }
}

export const registry = new ToolRegistry();