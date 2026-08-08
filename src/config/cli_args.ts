import { parseArgs } from "node:util";

const options = {
  model: {
    type: "string",
    short: "m",
  },
  maxTokens: {
    type: "string",
    short: "t",
  },
  print: {
    type: "string",
    short: "p",
  },
} as const;

export function parseCliArgs() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options,
    allowPositionals: true,
  });

  return { values, positionals };
}