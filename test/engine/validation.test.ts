import { describe, it, expect, beforeAll } from "vitest";
import { Validator } from "../../src/engine/validation.js";
import "../../src/tools/function_calling.js"; // register get_weather tool for testing

describe("Validator", () => {
  let validator: Validator;

  beforeAll(() => {
    validator = new Validator();
  });

  it("returns valid: false when the tool is not registered", async () => {
    const result = await validator.setToolValidation("non_existent_tool", {});
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns valid: false when a required parameter is missing", async () => {
    const result = await validator.setToolValidation("get_weather", {});
    expect(result.valid).toBe(false);
    expect(result.error).toContain("city"); // the error message should mention the missing parameter
  });

  it("returns valid: true when the tool and parameters are correct", async () => {
    const result = await validator.setToolValidation("get_weather", { city: "Zürich" });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});