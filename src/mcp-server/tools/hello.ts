import { z } from "zod/v3";
import type { ToolFactory } from "./types.js";

export const hello: ToolFactory = (ctx) => ({
  config: {
    description:
      "Returns a greeting to confirm the server is running and credentials are configured. " +
      "Use this to verify connectivity before calling other tools.",
    annotations: { title: "Hello", readOnlyHint: true, destructiveHint: false },
    inputSchema: {
      name: z.string().min(1).describe("The name to include in the greeting"),
    },
  },
  handler: async ({ name }) => {
    return {
      content: [{ type: "text", text: `Hello, ${name}! Server is ready.` }],
    };
  },
});
