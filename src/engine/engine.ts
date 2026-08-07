import { Adapter } from "../adapter/adapter.js";
import { ToolRegistry } from "../tools/registry.js";
import { Validator } from "./validation.js";
import { Logger } from "../traceability/logging.js";
import { ContextManager } from "../context/manager.js";

export class HarnessEngine {
    constructor(
        private systemPrompt: string,
        private adapter : Adapter,
        private registry : ToolRegistry,
        private validator : Validator,
        private logger : Logger,
        private context : ContextManager
    ) {}

    private MAX_TOOL_LOOP_COUNT = 5;

    async run_agent_loop(userInput: string): Promise<string> {
        // build object format for LLM
        let loop_counter = 1;
        let toolRetryCounter = 0;

        // append user input to context
        this.context.append({ role: "user", content: userInput });

        while (true) {
            // send request to LLM adapter
            const request = {
                system_prompt: this.systemPrompt,
                messages: this.context.getMessages(),
                available_tools: this.registry.getToolList()
            };
            this.logger.logCallSent(request); // log the request being sent to the LLM adapter
            const response = await this.adapter.sendRequest(request);
            this.logger.logResponseReceived(response); // log the response received from the LLM adapter
            

            // check response type and handle accordingly
            if (response.type === "text") {
                this.logger.logLoopEnd({ reason: "text", finalContent: response.content }); // log the end of the loop with the final content
                return response.content; // exit the loop if we have a final text response
            } else if (response.type === "tool_call") {
                const toolValidation = await this.validator.setToolValidation(response.tool_name, response.tool_parameters); // validate the tool call parameters
                if (!toolValidation.valid) { // if tool validation fails, log the error and retry the loop
                    this.logger.logValidationResult({ valid: toolValidation.valid, error: toolValidation.error }); // log the failed validation result
                    if (toolRetryCounter <= this.MAX_TOOL_LOOP_COUNT) {
                        this.context.append({
                        role: "tool", content: toolValidation.error ?? "Tool Validation failed.", tool_call_id: response.tool_id
                    });
                    this.logger.logRetryTriggered({ reason: `Tool validation failed for ${response.tool_name}`, attempt: toolRetryCounter }); // log the retry
                    toolRetryCounter++;
                    continue; // retry the loop
                    }
                    else {
                        this.logger.logLoopEnd({ reason: "error", finalContent: `Tool validation failed for ${response.tool_name} after ${this.MAX_TOOL_LOOP_COUNT} attempts.` });
                        return `Tool validation failed for ${response.tool_name} after ${this.MAX_TOOL_LOOP_COUNT} attempts.`; // exit the loop with an error message
                    }
                }
                this.logger.logValidationResult({ valid: toolValidation.valid, error: toolValidation.error }); // log the successful validation result
                // execute the tool
                this.logger.logToolCall({ toolName: response.tool_name, params: response.tool_parameters }); // log the tool call
                const toolResult = await this.registry.executeTool(response.tool_name, response.tool_parameters);
                this.logger.logToolResult({ toolName: response.tool_name, result: toolResult }); // log the result of the tool execution
                // append the result to context
                this.context.append({
                    role: "assistant",
                    content: response.tool_call_text ?? "",
                    tool_call: {
                    id: response.tool_id,
                    name: response.tool_name,
                    parameters: response.tool_parameters
                    }
                });
                this.context.append({
                    role: "tool",
                    content: toolResult,
                    tool_call_id: response.tool_id
                });

                // increment loop counter
                loop_counter++;
            }
            else {
                this.logger.logLoopEnd({ reason: "error", finalContent: response.error_message }); // log the end of the loop when error occurs
                throw new Error(response.error_message); // exit the loop if we have an error
            }
        }
    }
}