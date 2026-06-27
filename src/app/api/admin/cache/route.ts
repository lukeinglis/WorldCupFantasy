import { NextResponse } from "next/server";
import { getUserById, isKvConfigured } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { getCacheStats, clearCache } from "@/lib/api-cache";
import { getLogger } from "@/lib/logger";

async function verifyAdmin(request: Request): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!isKvConfigured()) {
    return { ok: false, response: NextResponse.json({ error: "KV not configured" }, { status: 503 }) };
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }

  const requestingUser = await getUserById(userId);
  if (!requestingUser || !isAdmin(requestingUser.email)) {
    return { ok: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }

  return { ok: true };
}

export async function GET(request: Request) {
  const log = getLogger("api/admin/cache");
  log.info("GET /api/admin/cache");

  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ stats: getCacheStats() });
}

export async function DELETE(request: Request) {
  const log = getLogger("api/admin/cache");
  log.info("DELETE /api/admin/cache");

  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  clearCache();
  log.info("Cache cleared by admin");
  return NextResponse.json({ success: true, message: "Cache cleared" });
}
