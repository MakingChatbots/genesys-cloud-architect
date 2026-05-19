import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";
import { hello } from "./tools";
import type { ServerContext } from "./tools/types.js";

const _envVars = z.object({}).parse(process.env);

const ctx: ServerContext = {};

const server = new McpServer(
    {
        name: "genesys-cloud-architect",
        version: process.env.npm_package_version ?? "0.0.0",
    },
    {
        instructions:
            "Use the hello tool to verify the server connection is working.",
    },
);

const helloTool = hello(ctx);
server.registerTool("hello", helloTool.config, helloTool.handler);

void (async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
})().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
