"use client";

import { useState } from "react";
import SortableTable from "./SortableTable";

interface ParticipantData {
  id: string;
  name: string;
  tier1Total: number;
  tier2Total: number;
  total: number;
  maxPossible: number;
  tiebreaker: { homeScore: number; awayScore: number };
  bonusPicks?: {
    goldenBoot: { pick: string; status: "earned" | "possible" | "lost" };
    goldenBall: { pick: string; status: "earned" | "possible" | "lost" };
    finalWinner: { pick: string; status: "earned" | "possible" | "lost" };
    mostGoals: { pick: string; status: "earned" | "possible" | "lost" };
    fewestConceded: { pick: string; status: "earned" | "possible" | "lost" };
  };
}

export interface Scenario {
  id: string;
  label: string;
  shortLabel: string;
  participants: ParticipantData[];
}

interface WhatIfLeaderboardProps {
  current: ParticipantData[];
  scenarios: Scenario[];
}

export default function WhatIfLeaderboard({ current, scenarios }: WhatIfLeaderboardProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const currentRanks = new Map<string, number>();
  current.forEach((p, i) => currentRanks.set(p.id, i + 1));

  // Compute best/worst finish for each participant across all scenarios
  const finishRange: Record<string, { best: number; worst: number }> = {};
  for (const p of current) {
    let best = Infinity;
    let worst = -Infinity;
    for (const s of scenarios) {
      const idx = s.participants.findIndex((sp) => sp.id === p.id);
      if (idx !== -1) {
        const rank = idx + 1;
        if (rank < best) best = rank;
        if (rank > worst) worst = rank;
      }
    }
    if (best !== Infinity) {
      finishRange[p.id] = { best, worst };
    }
  }

  const activeData = activeScenario
    ? scenarios.find((s) => s.id === activeScenario)?.participants ?? current
    : current;

  const rankChanges: Record<string, number> | undefined = activeScenario
    ? Object.fromEntries(
        activeData.map((p, i) => {
          const currentRank = currentRanks.get(p.id) ?? i + 1;
          const scenarioRank = i + 1;
          return [p.id, currentRank - scenarioRank];
        })
      )
    : undefined;

  return (
    <div>
      <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-3">
          What If...
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setActiveScenario(null)}
            className={`font-heading rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all ${
              activeScenario === null
                ? "bg-pitch text-white shadow-lg shadow-pitch/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Current Standings
          </button>
          <div className="grid grid-cols-2 gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setActiveScenario(scenario.id)}
                className={`rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left leading-tight ${
                  activeScenario === scenario.id
                    ? "bg-gold/20 text-gold border border-gold/40 shadow-lg shadow-gold/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-white/5"
                }`}
              >
                <span className="hidden sm:inline">{scenario.label}</span>
                <span className="sm:hidden">{scenario.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <SortableTable
        participants={activeData}
        rankChanges={rankChanges}
        finishRange={!activeScenario ? finishRange : undefined}
      />
    </div>
  );
}
