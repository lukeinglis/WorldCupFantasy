import logger from "./logger";

const log = logger.child({ module: "auth" });

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "usr_";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  log.info({ userId: result }, "generated user ID");
  return result;
}
