import { registry } from "../tools/index.js";

export class Validator {

    async setToolValidation(name: string, params: Record<string, unknown>): Promise<{ valid: boolean; error?: string }> {
        const tool = await registry.getRegisteredTool(name);

        if (!tool) {
            return { valid: false, error: `Tool "${name}" ist not registered.` };
        }

        const expectedParams = tool.def.parameters;
        for (const key in expectedParams) {
            if (expectedParams[key].required && !(key in params)) {
            return { valid: false, error: `Required parameter "${key}" is missing for tool "${name}".` };
            }
        }

        return { valid: true };
    }
}