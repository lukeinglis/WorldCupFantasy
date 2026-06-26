"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode } from "@/data/teams";
import {
  areTier1PicksRevealed,
  areTier2PicksRevealed,
  KNOCKOUT_START,
  formatRevealDate,
} from "@/lib/tournament-dates";
import type { ParticipantPicks } from "@/lib/picks-types";

export default function BonusPicksComparison() {
  const [participants, setParticipants] = useState<ParticipantPicks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/participants");
        const data = await res.json();
        setParticipants(data.participants ?? []);
      } catch {
        // Silently fail
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const tier1Revealed = areTier1PicksRevealed();
  const tier2Revealed = areTier2PicksRevealed();

  if (loading || !tier1Revealed) return null;

  const withPicks = participants.filter((p) => p.hasPicks && p.picks);

  if (withPicks.length === 0) return null;

  const bonusCategories = [
    {
      key: "goldenBoot" as const,
      label: "Golden Boot",
      icon: "👟",
      tier: 1,
      getValue: (p: ParticipantPicks) => p.picks?.goldenBoot ?? "",
    },
    {
      key: "mostGoalsTeam" as const,
      label: "Most Goals (Team)",
      icon: "⚽",
      tier: 1,
      getValue: (p: ParticipantPicks) => {
        const code = p.picks?.mostGoalsTeam ?? "";
        const team = getTeamByCode(code);
        return team ? `${team.flag} ${team.name}` : code;
      },
    },
    {
      key: "fewestConcededTeam" as const,
      label: "Fewest Conceded (Team)",
      icon: "🛡️",
      tier: 1,
      getValue: (p: ParticipantPicks) => {
        const code = p.picks?.fewestConcededTeam ?? "";
        const team = getTeamByCode(code);
        return team ? `${team.flag} ${team.name}` : code;
      },
    },
    {
      key: "goldenBall" as const,
      label: "Golden Ball",
      icon: "🌟",
      tier: 2,
      getValue: (p: ParticipantPicks) => p.picks?.goldenBall ?? "",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
          Bonus Picks Comparison
        </h3>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-white/5">
          {bonusCategories.map((cat) => {
            if (cat.tier === 2 && !tier2Revealed) {
              return (
                <div key={cat.key} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-white">{cat.label}</span>
                    <span className="text-xs text-gold">Tier 2</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Revealed on {formatRevealDate(KNOCKOUT_START)}
                  </p>
                </div>
              );
            }

            const pickDistribution: Record<string, string[]> = {};
            for (const p of withPicks) {
              const val = cat.getValue(p);
              if (val) {
                if (!pickDistribution[val]) pickDistribution[val] = [];
                pickDistribution[val].push(p.name);
              }
            }

            const sorted = Object.entries(pickDistribution).sort(
              (a, b) => b[1].length - a[1].length
            );

            return (
              <div key={cat.key} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium text-white">{cat.label}</span>
                  <span className={`text-xs ${cat.tier === 1 ? "text-accent" : "text-gold"}`}>
                    Tier {cat.tier}
                  </span>
                </div>
                {sorted.length === 0 ? (
                  <p className="text-xs text-gray-500">No picks submitted</p>
                ) : (
                  <div className="space-y-1.5">
                    {sorted.slice(0, 5).map(([value, names]) => (
                      <div key={value} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium truncate">{value}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({names.length}/{withPicks.length})
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cat.tier === 1 ? "bg-accent/40" : "bg-gold/40"}`}
                              style={{ width: `${(names.length / withPicks.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
