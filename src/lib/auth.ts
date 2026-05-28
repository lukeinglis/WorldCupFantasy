import logger from "./logger";

const log = logger.child({ module: "auth" });

const ADMIN_EMAILS = [
  "lukerichardinglis@gmail.com",
  "lukeinglis21@yahoo.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "usr_";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  log.info({ userId: result }, "generated user ID");
  return result;
}
