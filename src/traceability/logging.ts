import { AdapterRequest, AdapterResponse } from "../adapter/config.js";

export type LoggerEvents =
  | { eventType: "call_sent"; timestamp: Date; data: AdapterRequest }
  | { eventType: "response_received"; timestamp: Date; data: AdapterResponse }
  | { eventType: "validation_result"; timestamp: Date; data: { valid: boolean; error?: string } }
  | { eventType: "tool_call"; timestamp: Date; data: { toolName: string; params: Record<string, unknown> } }
  | { eventType: "tool_result"; timestamp: Date; data: { toolName: string; result: string } }
  | { eventType: "retry_triggered"; timestamp: Date; data: { reason: string; attempt: number } }
  | { eventType: "loop_end"; timestamp: Date; data: { reason: "text" | "error"; finalContent: string } };

export class Logger {
    private events: LoggerEvents[] = [];

    private log(eventType: LoggerEvents["eventType"], data: LoggerEvents["data"]): void {
        const event = { eventType, timestamp: new Date(), data } as LoggerEvents;
        this.events.push(event);
        console.log(JSON.stringify(event, null, 2));
    }

    logCallSent(data: AdapterRequest): void   {
        this.log("call_sent", data);
    }

    logResponseReceived(data: AdapterResponse): void   {
        this.log("response_received", data);
    }
    
    logValidationResult(data: { valid: boolean; error?: string }): void   {
        this.log("validation_result", data);
    }

    logToolCall(data: { toolName: string; params: Record<string, unknown> }): void   {
        this.log("tool_call", data);
    }

    logToolResult(data: { toolName: string; result: string }): void   {
        this.log("tool_result", data);
    }
        
    logRetryTriggered(data: { reason: string; attempt: number }): void   {
        this.log("retry_triggered", data);
    }

    logLoopEnd(data: { reason: "text" | "error"; finalContent: string }): void   {
        this.log("loop_end", data);
    }

    getEvents(): LoggerEvents[] {
        return this.events;
    }
}