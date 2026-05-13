/**
 * Tournament date constants and visibility helpers.
 *
 * Tier 1 picks are hidden until the first match kicks off (June 11, 2026).
 * Tier 2 picks are hidden until the knockout stage begins (~June 28, 2026).
 *
 * This is a simple client-side date check for UX purposes.
 * The data is in the frontend regardless, so this is about presentation, not security.
 */

// Tournament start: opening match kickoff (MEX vs RSA, 19:00 UTC / 3:00 PM ET)
export const TOURNAMENT_START = new Date("2026-06-11T19:00:00Z");

// Knockout stage start: first R32 match (19:00 UTC / 3:00 PM ET)
export const KNOCKOUT_START = new Date("2026-06-28T19:00:00Z");

export function areTier1PicksRevealed(): boolean {
  return new Date() >= TOURNAMENT_START;
}

export function areTier2PicksRevealed(): boolean {
  return new Date() >= KNOCKOUT_START;
}

export function formatRevealDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
