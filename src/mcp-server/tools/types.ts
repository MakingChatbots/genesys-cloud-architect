import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod/v3";

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

export type ToolFactory<U, T extends ZodRawShape = ZodRawShape> = (
    ctx: U,
) => ToolConfig<T>;
