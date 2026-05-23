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
  paymentConfirmed: boolean;
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
  const user = await kv.get<UserRecord>(`user:${name.toLowerCase()}`);
  logger.debug({ name, found: !!user }, "getUser lookup");
  return user;
}

export async function createUser(user: UserRecord): Promise<void> {
  requireKv();
  await kv.set(`user:${user.nameLower}`, user);
  const participants = await kv.get<string[]>("participants") ?? [];
  if (!participants.includes(user.id)) {
    participants.push(user.id);
    await kv.set("participants", participants);
  }
  await kv.set(`userid:${user.id}`, user.nameLower);
  logger.info({ userId: user.id, name: user.name }, "user created");
}

export async function updateUser(user: UserRecord): Promise<void> {
  requireKv();
  await kv.set(`user:${user.nameLower}`, user);
}

// ---- Picks operations ----

export async function getPicks(participantId: string): Promise<PicksRecord | null> {
  requireKv();
  return kv.get<PicksRecord>(`picks:${participantId}`);
}

export async function savePicks(picks: PicksRecord): Promise<void> {
  requireKv();
  await kv.set(`picks:${picks.participantId}`, picks);
  logger.info({ participantId: picks.participantId }, "picks saved");
}

// ---- List operations ----

export async function getAllParticipantIds(): Promise<string[]> {
  requireKv();
  const ids = (await kv.get<string[]>("participants")) ?? [];
  logger.debug({ count: ids.length }, "fetched participant IDs");
  return ids;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  requireKv();
  const nameLower = await kv.get<string>(`userid:${id}`);
  if (!nameLower) return null;
  return kv.get<UserRecord>(`user:${nameLower}`);
}

export async function getAllUsersWithPicks(): Promise<
  { user: UserRecord; picks: PicksRecord | null }[]
> {
  requireKv();
  const ids = await getAllParticipantIds();
  const results: { user: UserRecord; picks: PicksRecord | null }[] = [];

  for (const id of ids) {
    const user = await getUserById(id);
    if (!user) continue;
    const picks = await getPicks(id);
    results.push({ user, picks });
  }

  return results;
}

export { isKvConfigured };
