import { registry } from "../index.js";

// Register a new tool called "get_weather" with the ToolRegistry (test tool for function calling)
registry.registerNewTool(
  {
    name: "get_weather",
    description: "Get the current weather for a given city",
    parameters: {
      city: { type: "string", description: "Name of the city", required: true }
    }
  },
  "function_call",
  {
    handler: async (params) => {
      return `7°C, rainy in ${params.city}`;
    }
  }
);