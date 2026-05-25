/**
 * Storage layer using Vercel KV (Redis).
 *
 * KV env vars required in production:
 *   KV_REST_API_URL, KV_REST_API_TOKEN
 *
 * When KV is not configured, operations throw with a clear message
 * so the admin knows to provision a KV store.
 */

import { kv } from "@vercel/kv";
import logger from "./logger";

const log = logger.child({ module: "storage" });

// ---- Key schema ----
// user:<name_lower>          -> UserRecord
// picks:<participantId>      -> PicksRecord
// participants               -> string[]  (list of participant IDs)

export interface UserRecord {
  id: string;           // e.g. "usr_abc123"
  name: string;         // display name
  nameLower: string;    // lowercase for lookup
  email: string;
  emailLower: string;   // lowercase for matching
  createdAt: string;    // ISO timestamp
}

export interface PicksRecord {
  participantId: string;
  groupPredictions: {
    group: string;
    order: [string, string, string, string];
  }[];
  goldenBoot: string;
  mostGoalsTeam: string;
  fewestConcededTeam: string;
  goldenBall: string;
  tiebreaker: { homeScore: number; awayScore: number };
  submittedAt: string;  // ISO timestamp
  tier2Submitted: boolean;
  knockoutPicks: { round: string; matchNumber: number; winner: string }[];
}

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function requireKv(): void {
  if (!isKvConfigured()) {
    throw new Error(
      "Vercel KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN environment variables. " +
      "See the README for setup instructions."
    );
  }
}

// ---- User operations ----

export async function getUser(name: string): Promise<UserRecord | null> {
  requireKv();
  const key = `user:${name.toLowerCase()}`;
  const start = Date.now();
  const user = await kv.get<UserRecord>(key);
  log.info({ key, found: !!user, durationMs: Date.now() - start }, "getUser");
  return user;
}

export async function createUser(user: UserRecord): Promise<void> {
  requireKv();
  const start = Date.now();
  await kv.set(`user:${user.nameLower}`, user);
  const participants = await kv.get<string[]>("participants") ?? [];
  if (!participants.includes(user.id)) {
    participants.push(user.id);
    await kv.set("participants", participants);
  }
  await kv.set(`userid:${user.id}`, user.nameLower);
  log.info({ userId: user.id, name: user.nameLower, durationMs: Date.now() - start }, "createUser");
}

export async function updateUser(user: UserRecord): Promise<void> {
  requireKv();
  const start = Date.now();
  await kv.set(`user:${user.nameLower}`, user);
  log.info({ userId: user.id, key: `user:${user.nameLower}`, durationMs: Date.now() - start }, "updateUser");
}

// ---- Picks operations ----

export async function getPicks(participantId: string): Promise<PicksRecord | null> {
  requireKv();
  const key = `picks:${participantId}`;
  const start = Date.now();
  const picks = await kv.get<PicksRecord>(key);
  log.info({ key, found: !!picks, durationMs: Date.now() - start }, "getPicks");
  return picks;
}

export async function savePicks(picks: PicksRecord): Promise<void> {
  requireKv();
  const key = `picks:${picks.participantId}`;
  const start = Date.now();
  await kv.set(key, picks);
  log.info({ key, participantId: picks.participantId, durationMs: Date.now() - start }, "savePicks");
}

// ---- List operations ----

export async function getAllParticipantIds(): Promise<string[]> {
  requireKv();
  const start = Date.now();
  const ids = (await kv.get<string[]>("participants")) ?? [];
  log.info({ count: ids.length, durationMs: Date.now() - start }, "getAllParticipantIds");
  return ids;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  requireKv();
  const start = Date.now();
  const nameLower = await kv.get<string>(`userid:${id}`);
  if (!nameLower) {
    log.info({ userId: id, found: false, durationMs: Date.now() - start }, "getUserById");
    return null;
  }
  const user = await kv.get<UserRecord>(`user:${nameLower}`);
  log.info({ userId: id, found: !!user, durationMs: Date.now() - start }, "getUserById");
  return user;
}

export async function getAllUsersWithPicks(): Promise<
  { user: UserRecord; picks: PicksRecord | null }[]
> {
  requireKv();
  const start = Date.now();
  const ids = await getAllParticipantIds();
  const results: { user: UserRecord; picks: PicksRecord | null }[] = [];

  for (const id of ids) {
    const user = await getUserById(id);
    if (!user) continue;
    const picks = await getPicks(id);
    results.push({ user, picks });
  }

  log.info({ participantCount: ids.length, returnedCount: results.length, durationMs: Date.now() - start }, "getAllUsersWithPicks");
  return results;
}

export { isKvConfigured };
