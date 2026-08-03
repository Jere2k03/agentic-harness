import { ToolDefinition } from "../config.js";

// Define the types for different execution methods of tools
type ExecutionType = "mcp" | "code_gen" | "function_call";
type ToolHandler = (params: Record<string, unknown>) => Promise<string>;
type ToolCaller = 
    {type: "mcp"; serverUrl: string; remoteName: string } |
    {type: "code_gen"; params: ToolHandler} |
    {type: "function_call"; params: ToolHandler};

// Define the structure of a registered tool, including its definition, execution type, and caller information
interface RegisteredTool {
    def: ToolDefinition;
    execType: ExecutionType;
    caller: ToolCaller;
}

// Define the ToolRegistry class that manages the registration and execution of tools
export class ToolRegistry {
    private tools: Map<string, RegisteredTool> = new Map();

    // Register a new tool with its definition and handler function
    registerNewTool(
        definition: ToolDefinition,
        executionType: ExecutionType,
        options: { handler?: ToolHandler; serverUrl?: string; remoteName?: string }
    ) {
        switch (executionType) {
            case "function_call":
            if (!options.handler) throw new Error("function_call braucht einen handler");
            this.registerFunctionTool(definition, options.handler);
            break;
            case "mcp":
            if (!options.serverUrl || !options.remoteName) throw new Error("mcp braucht serverUrl und remoteName");
            this.registerMcpTool(definition, options.serverUrl, options.remoteName);
            break;
            case "code_gen":
            this.registerCodeGenTool(definition);
            break;
        }
    }

    // Register a new tool that is executed via a function call
    private registerFunctionTool(definition: ToolDefinition, handler: ToolHandler) {
        this.tools.set(definition.name, { def: definition, execType: "function_call", caller: { type: "function_call", params: handler } });
    }

    // Register a new tool that is executed via an MCP (Microservice Communication Protocol) call
    private registerMcpTool(definition: ToolDefinition, serverUrl: string, remoteName: string) {
        this.tools.set(definition.name, { def: definition, execType: "mcp", caller: { type: "mcp", serverUrl, remoteName } });
    }

    // Register a new tool that is executed via code generation
    private registerCodeGenTool(definition: ToolDefinition) {
        this.tools.set(definition.name, { def: definition, execType: "code_gen", caller: { type: "code_gen", params: async (params: Record<string, unknown>) => "" } });
    }

    // Retrieve the definition of a registered tool for the AdapterRequest
    getToolList(): ToolDefinition[] {
        const toolList: ToolDefinition[] = [];
        for (const [, tool] of this.tools.entries()) {
            toolList.push(tool.def);
        }
        return toolList;
    }

    // Execute a registered tool with the provided parameters
    executeTool(name: string, params: Record<string, unknown>): Promise<string> {
        const registeredTool = this.tools.get(name);
        if (!registeredTool) {
            throw new Error(`Tool ${name} is not registered.`);
        }

        switch (registeredTool.caller.type) {
            case "function_call":
                return registeredTool.caller.params(params);
            case "mcp":
                // Implement MCP call logic here
                return Promise.resolve(`MCP call to ${registeredTool.caller.serverUrl} for tool ${name}`);
            case "code_gen":
                // Implement code generation logic here
                return Promise.resolve(`Code generation for tool ${name}`);
            default:
                throw new Error(`Unknown execution type for tool ${name}.`);
        }
    }
}