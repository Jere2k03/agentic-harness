import { Adapter } from "../adapter/adapter.js";
import { ToolRegistry } from "../tools/registry.js";
import { Validator } from "./validation.js";
import { Logger } from "../traceability/logging.js";
import { ContextManager } from "../context/manager.js";

export class HarnessEngine {
    constructor(
        private adapter : Adapter,
        private registry : ToolRegistry,
        private validator : Validator,
        private logger : Logger,
        private context : ContextManager
    ) {}

    private SYSTEM_PROMPT = "You always answer in british slang, and you are a helpful assistant. You can call tools if needed, and you will always try to answer the user question.";

    async run_agent_loop(userInput: string): Promise<string> {
        // build object format for LLM
        let loop_counter = 1;

        // append user input to context
        this.context.append({ role: "user", content: userInput });

        while (true) {
            // send request to LLM adapter
            const response = await this.adapter.sendRequest({
            system_prompt: this.SYSTEM_PROMPT,
            messages: this.context.getMessages(),
            available_tools: this.registry.getToolList()
            });

            // check response type and handle accordingly
            if (response.type === "text") {
                //console.log("Answer:", response.content);
                return response.content; // exit the loop if we have a final text response
            } else if (response.type === "tool_call") {
                // execute the tool
                const toolResult = await this.registry.executeTool(response.tool_name, response.tool_parameters);
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
                // increment loop counter and log the round
                loop_counter++;
                // console.log("got a tool call; now loop round ", loop_counter, "...");
            }
            else {
                console.log("Error:", response.error_message);
                throw new Error(response.error_message); // exit the loop if we have an error
            }
        }
    }

}