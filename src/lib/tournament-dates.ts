/**
 * Tournament date constants and visibility helpers.
 *
 * Tier 1 picks are hidden until the first match kicks off (June 11, 2026).
 * Tier 2 picks are hidden until the knockout stage begins (~June 28, 2026).
 *
 * This is a simple client-side date check for UX purposes.
 * The data is in the frontend regardless, so this is about presentation, not security.
 */

type LogFn = (obj: Record<string, unknown>, msg: string) => void;
const noop: LogFn = () => {};
let _log: { debug: LogFn } | null = null;

function getLogger(): { debug: LogFn } {
  if (_log) return _log;
  if (typeof window !== "undefined") {
    _log = { debug: noop };
    return _log;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const logger = require("./logger").default;
    _log = logger;
    return _log!;
  } catch {
    _log = { debug: noop };
    return _log;
  }
}

// Tournament start: opening match kickoff (MEX vs RSA, 19:00 UTC / 3:00 PM ET)
export const TOURNAMENT_START = new Date("2026-06-11T19:00:00Z");

// Knockout stage start: first R32 match (19:00 UTC / 3:00 PM ET)
export const KNOCKOUT_START = new Date("2026-06-28T19:00:00Z");

export function areTier1PicksRevealed(): boolean {
  const revealed = new Date() >= TOURNAMENT_START;
  getLogger().debug({ revealed, tier: 1 }, "tier 1 visibility check");
  return revealed;
}

export function areTier2PicksRevealed(): boolean {
  const revealed = new Date() >= KNOCKOUT_START;
  getLogger().debug({ revealed, tier: 2 }, "tier 2 visibility check");
  return revealed;
}

export function formatRevealDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
