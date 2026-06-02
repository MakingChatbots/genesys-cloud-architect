import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import platformClient from "purecloud-platform-client-v2";
import { z } from "zod/v3";
import { deployFlow } from "./tools/deploy-flow.ts";
import { flowDependencies } from "./tools/flow-dependencies.ts";

const envResults = z
    .object({
        CLAUDE_PLUGIN_OPTION_genesys_region: z.string().min(1),
        CLAUDE_PLUGIN_OPTION_genesys_client_id: z.string().min(1),
        CLAUDE_PLUGIN_OPTION_genesys_client_secret: z.string().min(1),
    })
    .safeParse(process.env);

if (!envResults.success) {
    const missing = envResults.error.issues.map((i) => i.path[0]).join("\n ");
    console.error(`Missing required environment variables:\n${missing}`);
    process.exit(1);
}

const envVars = envResults.data;

const server = new McpServer({
    name: "genesys-cloud-architect",
    version: process.env.npm_package_version ?? "0.0.0",
});

const flowDependenciesTool = flowDependencies({
    architectApi: new platformClient.ArchitectApi(),
});
server.registerTool(
    "flow_dependencies",
    flowDependenciesTool.config,
    flowDependenciesTool.handler,
);

const deployFlowTool = deployFlow({
    clientId: envVars.CLAUDE_PLUGIN_OPTION_genesys_client_id,
    clientSecret: envVars.CLAUDE_PLUGIN_OPTION_genesys_client_secret,
    region: envVars.CLAUDE_PLUGIN_OPTION_genesys_region,
});
server.registerTool(
    "deploy_flow",
    deployFlowTool.config,
    deployFlowTool.handler,
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
