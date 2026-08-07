import { AgentMessage } from "../adapter/config.js";

// Define the ContextManager class that manages the context of messages exchanged between the user and the assistant
export class ContextManager {
    private context: AgentMessage[] = [];

    // Append a new message to the context
    append(message: AgentMessage): void {
        this.context.push(message);
    }

    // Retrieve the current context of messages
    getMessages(): AgentMessage[] {
        return this.context;
    }
}