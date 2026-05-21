import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ArchitectApi } from "purecloud-platform-client-v2";
import type { ZodRawShape } from "zod/v3";

export type ServerContext = {
    architectApi: ArchitectApi;
};

export type ToolConfig<T extends ZodRawShape = ZodRawShape> = {
    config: {
        description: string;
        annotations: ToolAnnotations;
        inputSchema: T;
    };
    handler: (args: Record<string, unknown>) => Promise<{
        isError?: boolean;
        content: Array<{ type: "text"; text: string }>;
    }>;
};

export type ToolFactory<T extends ZodRawShape = ZodRawShape> = (
    ctx: ServerContext,
) => ToolConfig<T>;
