// biome-ignore-all lint/suspicious/noExplicitAny: monkey-patching the SDK requires unsafe casts
// biome-ignore-all lint/complexity/noBannedTypes: same reason
// biome-ignore-all lint/style/noNonNullAssertion: statusCode is guaranteed non-null inside the >= 400 guard
import type { IncomingMessage, RequestOptions } from "node:http";
import https from "node:https";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const TIMEOUT_MS = 90_000;

type LogLevel = "info" | "warn" | "error";

function emit(type: "log", level: LogLevel, message: string): void;
function emit(
    type: "result",
    payload: {
        success: boolean;
        flowId?: string;
        flowName?: string;
        error?: string;
    },
): void;
function emit(type: string, ...args: unknown[]): void {
    if (type === "log") {
        const [level, message] = args as [LogLevel, string];
        process.stdout.write(`${JSON.stringify({ type, level, message })}\n`);
    } else {
        const [payload] = args as [Record<string, unknown>];
        process.stdout.write(`${JSON.stringify({ type, ...payload })}\n`);
    }
}

// ── HTTPS interceptor ──────────────────────────────────────────────────
// Must be installed before requiring the SDK so all its requests are wrapped.

interface HttpError {
    status: number;
    method: string;
    path: string | undefined;
    body: unknown;
}

const httpErrors: HttpError[] = [];
const traces: string[] = [];

function wrapResponseCallback(args: any[], opts: RequestOptions): void {
    const lastIdx = args.length - 1;
    if (lastIdx < 0 || typeof args[lastIdx] !== "function") return;
    const origCb = args[lastIdx] as (res: IncomingMessage) => void;
    args[lastIdx] = (res: IncomingMessage) => {
        if (res.statusCode && res.statusCode >= 400) {
            let body = "";
            res.on("data", (chunk: Buffer) => (body += chunk));
            res.on("end", () => {
                let parsed: unknown;
                try {
                    parsed = JSON.parse(body);
                } catch {
                    parsed = body;
                }
                const entry: HttpError = {
                    status: res.statusCode!,
                    method: opts.method || "GET",
                    path: opts.path ?? undefined,
                    body: parsed,
                };
                httpErrors.push(entry);
                const msg =
                    typeof parsed === "object" && parsed !== null
                        ? (parsed as any).message ||
                          (parsed as any).error ||
                          JSON.stringify(parsed)
                        : parsed;
                emit(
                    "log",
                    "error",
                    `HTTP ${entry.status} ${entry.method} ${entry.path} — ${msg}`,
                );
            });
        }
        origCb(res);
    };
}

function extractOpts(args: any[]): RequestOptions {
    for (const arg of args) {
        if (typeof arg === "object" && arg !== null && !(arg instanceof URL))
            return arg as RequestOptions;
    }
    return {};
}

const origRequest = https.request;
(https as any).request = function patchedRequest(...args: any[]) {
    wrapResponseCallback(args, extractOpts(args));
    return origRequest.apply(this, args as any);
};

const origGet = https.get;
(https as any).get = function patchedGet(...args: any[]) {
    wrapResponseCallback(args, extractOpts(args));
    return origGet.apply(this, args as any);
};

// ── TRACE interceptor ──────────────────────────────────────────────────
// The SDK writes TRACE: lines directly to console.log and stdout, bypassing
// the logging callback. These often contain the actual permission error text.

const origConsoleLog = console.log;
const tracePrefix = "TRACE:";

function interceptTrace(text: string): boolean {
    if (text.startsWith(tracePrefix)) {
        const msg = text.slice(tracePrefix.length).trim();
        traces.push(msg);
        emit("log", "info", msg);
        return true;
    }
    return false;
}

console.log = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string") {
        if (interceptTrace(first)) return;
        if (first.startsWith("- ") || first.startsWith("navigator unavailable"))
            return;
    }
    origConsoleLog.apply(console, args);
};

const origStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = ((chunk: unknown, ...rest: unknown[]): boolean => {
    const str = typeof chunk === "string" ? chunk : String(chunk);
    if (str.startsWith(tracePrefix)) {
        interceptTrace(str.trimEnd());
        return true;
    }
    return (origStdoutWrite as Function)(chunk, ...rest);
}) as typeof process.stdout.write;

// ── SDK logging ────────────────────────────────────────────────────────

import type {
    ArchitectScripting,
    ArchSession,
} from "purecloud-flow-scripting-api-sdk-javascript";

const LEVEL_PREFIX: Record<string, LogLevel> = {
    error: "error",
    warning: "warn",
    info: "info",
};

interface SdkLogMessage {
    logType?: string;
    messageParts?: { message?: string };
    messageFull?: string;
}

function installLogging(scripting: ArchitectScripting): void {
    const logging = scripting.services.archLogging;
    logging.setLoggingCallback((logMessage: SdkLogMessage) => {
        const level = logMessage.logType || "info";
        const msg =
            logMessage.messageParts?.message || logMessage.messageFull || "";
        if (msg.includes("clientSecret:") || msg.includes("auth token"))
            return false;
        emit("log", LEVEL_PREFIX[level] || "info", msg);
        return false;
    });
}

// ── Session wrapper ────────────────────────────────────────────────────

interface SessionConfig {
    region: string;
    clientId: string;
    clientSecret: string;
}

function startSession(
    scripting: ArchitectScripting,
    { region, clientId, clientSecret }: SessionConfig,
): Promise<ArchSession> {
    const session = scripting.environment.archSession;
    session.endTerminatesProcess = false;

    return new Promise((resolve, reject) => {
        let started = false;
        session.startWithClientIdAndSecret(
            region,
            function onStarted() {
                started = true;
                resolve(session);
            },
            clientId,
            clientSecret,
            function onEnding() {
                if (started) return;
                const lastHttp = httpErrors[httpErrors.length - 1];
                const lastTrace = traces[traces.length - 1];
                const detail = lastHttp
                    ? `HTTP ${lastHttp.status}: ${typeof lastHttp.body === "object" ? (lastHttp.body as any).message || JSON.stringify(lastHttp.body) : lastHttp.body}`
                    : lastTrace ||
                      "Session ended before authentication completed";
                reject(new Error(`Session start failed — ${detail}`));
            },
            true,
        );
    });
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const timer = setTimeout(() => {
        emit("result", {
            success: false,
            error: `Deploy timed out after ${TIMEOUT_MS / 1000}s`,
        });
        process.exit(2);
    }, TIMEOUT_MS);
    timer.unref();

    const { values } = parseArgs({
        options: {
            "flow-file": { type: "string" },
        },
        strict: true,
    });

    const flowFile = values["flow-file"];

    if (!flowFile) {
        emit("result", {
            success: false,
            error: "Missing --flow-file argument",
        });
        process.exit(1);
    }

    const absoluteFlowPath = path.resolve(flowFile);

    const region = process.env.GENESYS_REGION;
    const clientId = process.env.GENESYS_CLIENT_ID;
    const clientSecret = process.env.GENESYS_CLIENT_SECRET;

    if (!region || !clientId || !clientSecret) {
        emit("result", {
            success: false,
            error: "Missing required environment variables: GENESYS_REGION, GENESYS_CLIENT_ID, GENESYS_CLIENT_SECRET",
        });
        process.exit(1);
    }

    emit("log", "info", "Loading Architect Scripting SDK...");
    const scripting: ArchitectScripting = require("purecloud-flow-scripting-api-sdk-javascript");

    installLogging(scripting);

    emit("log", "info", `Starting SDK session (region: ${region})...`);

    const session = await startSession(scripting, {
        region,
        clientId,
        clientSecret,
    });

    try {
        emit("log", "info", `Importing flow file: ${absoluteFlowPath}`);
        const mod = await import(pathToFileURL(absoluteFlowPath).href);

        if (typeof mod.buildFlow !== "function") {
            emit("result", {
                success: false,
                error: `Flow file does not export a buildFlow function: ${absoluteFlowPath}`,
            });
            return;
        }

        await mod.buildFlow(scripting);

        emit("result", { success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        emit("result", { success: false, error: message });
    } finally {
        session.endExitCode = 0;
        session.end();
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        emit("result", {
            success: false,
            error: `Unhandled error: ${err instanceof Error ? err.message : String(err)}`,
        });
        process.exit(1);
    });
