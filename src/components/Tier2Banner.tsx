"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { getCurrentPhase } from "@/data/participants";
import { KNOCKOUT_START } from "@/lib/tournament-dates";

export default function Tier2Banner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const phase = getCurrentPhase();

  if (dismissed) return null;

  const now = new Date();
  const knockoutLocked = now >= KNOCKOUT_START;

  // Only show during group_stage (late) and knockout phases
  if (phase !== "group_stage" && phase !== "knockout") return null;

  // Don't show if knockout picks are already locked
  if (knockoutLocked) return null;

  const daysUntilLock = Math.max(
    0,
    Math.ceil((KNOCKOUT_START.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="border-b border-gold/20 bg-gold/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gold text-lg shrink-0" aria-hidden>🏆</span>
          <p className="text-sm text-gray-300 truncate">
            <span className="font-bold text-gold">Knockout bracket picks are open!</span>
            {" "}
            {user ? (
              <Link href="/my-picks" className="underline hover:text-gold transition-colors">
                Submit your Tier 2 picks
              </Link>
            ) : (
              <Link href="/join" className="underline hover:text-gold transition-colors">
                Sign in to submit
              </Link>
            )}
            {daysUntilLock > 0 && (
              <span className="text-gray-500">
                {" "}({daysUntilLock} {daysUntilLock === 1 ? "day" : "days"} remaining)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
