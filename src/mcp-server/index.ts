import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import platformClient from "purecloud-platform-client-v2";
import { z } from "zod/v3";
import { flowDependencies } from "./tools/flow-dependencies.ts";
import type { ServerContext } from "./tools/types.ts";

const envVars = z
    .object({
        CLAUDE_PLUGIN_OPTION_genesys_region: z.string().min(1),
        CLAUDE_PLUGIN_OPTION_genesys_client_id: z.string().min(1),
        CLAUDE_PLUGIN_OPTION_genesys_client_secret: z.string().min(1),
    })
    .parse(process.env);

const ctx: ServerContext = {
    architectApi: new platformClient.ArchitectApi(),
};

const server = new McpServer({
    name: "genesys-cloud-architect",
    version: process.env.npm_package_version ?? "0.0.0",
});

const flowDependenciesTool = flowDependencies(ctx);
server.registerTool(
    "flow_dependencies",
    flowDependenciesTool.config,
    flowDependenciesTool.handler,
);

void (async () => {
    const client = platformClient.ApiClient.instance;
    client.setEnvironment(envVars.CLAUDE_PLUGIN_OPTION_genesys_region);
    await client.loginClientCredentialsGrant(
        envVars.CLAUDE_PLUGIN_OPTION_genesys_client_id,
        envVars.CLAUDE_PLUGIN_OPTION_genesys_client_secret,
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
})().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
