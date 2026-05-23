import { NextResponse } from "next/server";
import logger from "./logger";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const windows = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = windows.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < WINDOW_MS);

  if (valid.length >= MAX_REQUESTS) {
    windows.set(key, valid);
    return true;
  }

  valid.push(now);
  windows.set(key, valid);
  return false;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function withRateLimit(
  handler: (request: Request, ...args: unknown[]) => Promise<Response>
) {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    const ip = getClientIp(request);
    const route = new URL(request.url).pathname;
    const key = `${ip}:${route}`;

    if (isRateLimited(key)) {
      logger.warn({ ip, route }, "rate limit exceeded");
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return handler(request, ...args);
  };
}
