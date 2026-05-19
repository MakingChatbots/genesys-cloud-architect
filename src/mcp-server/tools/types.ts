import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod/v3";

// biome-ignore lint/complexity/noBannedTypes: placeholder until real properties are added
export type ServerContext = {};

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
