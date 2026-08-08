import vm from "node:vm";
import { registry } from "../index.js";

registry.registerNewTool(
  {
    name: "execute_code",
    description: "Executes a JavaScript code snippet in a sandbox. Use the built-in vmLog(...) function instead of console.log(...) to output values you want returned as the result.",
    parameters: {
      code: { type: "string", description: "The JavaScript code to execute", required: true }
    }
  },
  "code_gen",
  {
    handler: async (params) => {
      const code = params.code as string;

      const vmLogArray: string[] = [];
      function vmLog(...args: unknown[]) {
        const logMessage = args.map(arg => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" ");
        vmLogArray.push(logMessage);
      }

      const context = { vmLogArray, vmLog };
      vm.createContext(context);

      try {
        new vm.Script(code).runInContext(context, { timeout: 5000 });
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      return vmLogArray.join("\n");
    }
  }
);