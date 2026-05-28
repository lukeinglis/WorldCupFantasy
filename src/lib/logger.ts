/**
 * Structured logging with Pino.
 *
 * Server-side: returns a real Pino child logger with JSON output.
 * Client-side: returns a silent no-op logger (logging is server-only).
 */

import type { Logger } from "pino";

// No-op logger for client-side usage
const noop = () => {};
const noopLogger: Logger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
  trace: noop,
  fatal: noop,
  child: () => noopLogger,
  level: "silent",
} as unknown as Logger;

let rootLogger: Logger | null = null;

function getRootLogger(): Logger {
  if (rootLogger) return rootLogger;

  if (typeof window !== "undefined") {
    rootLogger = noopLogger;
    return rootLogger;
  }

  // Dynamic require so the import only runs server-side
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pino = require("pino") as (opts: { level: string }) => Logger;
  rootLogger = pino({
    level: process.env.LOG_LEVEL ?? "info",
  });

  return rootLogger;
}

/**
 * Get a named child logger.
 *
 * Usage:
 *   const log = getLogger("storage");
 *   log.info({ key }, "cache hit");
 */
export function getLogger(name: string): Logger {
  return getRootLogger().child({ module: name });
}
