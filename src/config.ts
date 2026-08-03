// Define the roles that can be assigned to messages in the agent-LLM interaction
type ModelRoles = "user" | "assistant" | "tool";

// Define the structure of messages exchanged between the agent and the LLM
export interface AgentMessage {
    role: ModelRoles;
    content: string;
    tool_call?: {id: string, name: string, parameters: Record<string, unknown>}; //only if Role is "assistant" and the message is a tool call
    tool_call_id?: string; //only if Role is "assistant"
}

// Define the structure of tool definitions that can be registered and used by the agent
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string; required: boolean }>;
}

// Define the structure of internal Requests sent to the LLM adapter
export interface AdapterRequest {
    system_prompt: string;
    messages: AgentMessage[];
    available_tools: ToolDefinition[];
}

// Define the structure of internal Responses received from the LLM adapter
export type AdapterResponse =
    {type: "text", content: string, truncated?: boolean} |
    {type: "tool_call", tool_id: string, tool_name: string, tool_parameters: Record<string, unknown>, tool_call_text?: string} |
    {type: "error", error_message: string};