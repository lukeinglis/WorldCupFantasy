import { AsyncLocalStorage } from "node:async_hooks";

export const requestIdStorage = new AsyncLocalStorage<string>();

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function getRequestId(): string {
  return requestIdStorage.getStore() ?? "unknown";
}
