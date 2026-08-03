import {Adapter} from "./adapter.js";
import {AdapterRequest, AdapterResponse} from "../config.js";
import {Anthropic} from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

// Define the AnthropicAdapter class that implements the Adapter interface
export class AnthropicAdapter implements Adapter {
    private client: Anthropic;

    // Initialize the AnthropicAdapter with the provided API key
    constructor(apiKey: string) {
        this.client = new Anthropic({apiKey: apiKey});
    }

    // Send a request to the Anthropic API and return the translated response
    async sendRequest(request: AdapterRequest): Promise<AdapterResponse> {
        // console.log("Sending request to Anthropic API:", request);
        // set up the parameters for the Anthropic API request
        const anthropic_params: Anthropic.MessageCreateParams = {
            model: "claude-haiku-4-5",
            max_tokens: 1024,
            system: request.system_prompt,
            messages: request.messages.map(msg => {
            // If the message is from the tool, format it as a user message with a tool_result block
            if (msg.role === "tool") {
                return {
                role: "user",
                content: [{
                    type: "tool_result",
                    tool_use_id: msg.tool_call_id || "",
                    content: msg.content
                }]
                };
            }
            // If the message is from the assistant and contains a tool call, format it accordingly
            if (msg.role === "assistant" && msg.tool_call) {
                const blocks: Anthropic.ContentBlockParam[] = [];
                if (msg.content) {
                blocks.push({ type: "text", text: msg.content });
                }
                blocks.push({
                type: "tool_use",
                id: msg.tool_call.id,
                name: msg.tool_call.name,
                input: msg.tool_call.parameters
                });
                return { role: "assistant", content: blocks };
            }

            return { role: msg.role, content: msg.content };
            }),
            tools: [ // map the available tools to the format expected by the Anthropic API
                ...request.available_tools.map(tool => ({
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": {
                        "type": "object" as const,
                        "properties": Object.fromEntries(
                            Object.entries(tool.parameters).map(([key, val]) => [
                            key,
                            { type: val.type, description: val.description }
                            ])
                        ),
                        "required": Object.entries(tool.parameters)
                            .filter(([, val]) => val.required)
                            .map(([key]) => key)
                    }
                }))
            ]
        };
        // send the request to the Anthropic API
        const message = await this.client.messages.create(anthropic_params);
        //console.log("Anthropic API response:", message);
        return this.translateAnthropicMsgToInternal(message);
    }

    // Translate the response from the Anthropic API to the internal AdapterResponse format
    private translateAnthropicMsgToInternal(message: Anthropic.Message): AdapterResponse {
        const toolUseBlock = message.content.find(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
        );
        const textBlock = message.content.find(
            (block): block is Anthropic.TextBlock => block.type === "text"
        );

        let adapterResponse: AdapterResponse;
        
        // Translate the stop_reason from the Anthropic API to the internal AdapterResponse format
        switch (message.stop_reason) {
            case "tool_use":
                if (!toolUseBlock) {
                    adapterResponse = {
                        type: "error",
                        error_message: "stop_reason=tool_use, aber kein tool_use-Block gefunden",
                    };
                    break;
                }
                adapterResponse = {
                    type: "tool_call",
                    tool_id: toolUseBlock.id,
                    tool_name: toolUseBlock.name,
                    tool_parameters: toolUseBlock.input as Record<string, unknown>,
                    tool_call_text: textBlock?.text,
                };
                break;

            case "end_turn":
                if (!textBlock) {
                    adapterResponse = {
                        type: "error",
                        error_message: "stop_reason=end_turn, aber kein text-Block gefunden",
                    };
                    break;
                }
                adapterResponse = {
                    type: "text",
                    content: textBlock.text,
                };
                break;

            case "max_tokens":
                adapterResponse = {
                    type: "text",
                    content: textBlock?.text ?? "",
                    truncated: true,
                };
                break;

            default:
                adapterResponse = {
                    type: "error",
                    error_message: `Unbehandelter stop_reason: ${message.stop_reason}`,
                };
                break;
        }

        // console.log("Translated AdapterResponse:", adapterResponse);
        return adapterResponse;
    }
}