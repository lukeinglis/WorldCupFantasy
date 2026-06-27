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

interface Scorer {
  playerName: string;
  teamName: string;
  teamTla: string;
  goals: number;
}

interface TeamStat {
  teamName: string;
  teamTla: string;
  goalsScored: number;
  goalsConceded: number;
  matchesPlayed: number;
}

interface ActualLeaders {
  scorers: Scorer[];
  teamsByGoals: TeamStat[];
  teamsByConceded: TeamStat[];
}

function useActualLeaders(): { leaders: ActualLeaders | null; loading: boolean } {
  const [leaders, setLeaders] = useState<ActualLeaders | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const [scorersRes, statsRes] = await Promise.all([
          fetch("/api/football/scorers"),
          fetch("/api/football/stats"),
        ]);

        const scorersData = scorersRes.ok ? await scorersRes.json() : null;
        const statsData = statsRes.ok ? await statsRes.json() : null;

        const scorers: Scorer[] = (scorersData?.scorers ?? []).slice(0, 3);

        const allStats: TeamStat[] = statsData?.stats ?? [];
        const withMatches = allStats.filter((t: TeamStat) => t.matchesPlayed > 0);

        const teamsByGoals = [...withMatches]
          .sort((a, b) => b.goalsScored - a.goalsScored)
          .slice(0, 3);

        const teamsByConceded = [...withMatches]
          .sort((a, b) => a.goalsConceded - b.goalsConceded)
          .slice(0, 3);

        setLeaders({ scorers, teamsByGoals, teamsByConceded });
      } catch {
        // API unavailable
      }
      setLoading(false);
    }
    fetchLeaders();
  }, []);

  return { leaders, loading };
}

function LeaderBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold">
      Leading!
    </span>
  );
}

function ActualLeaderColumn({
  categoryKey,
  leaders,
  pickedValues,
}: {
  categoryKey: string;
  leaders: ActualLeaders | null;
  pickedValues: Set<string>;
}) {
  if (!leaders) {
    return <p className="text-xs text-gray-500">Loading tournament data...</p>;
  }

  if (categoryKey === "goldenBall") {
    return (
      <p className="text-xs text-gray-400 italic">
        Awarded after the Final
      </p>
    );
  }

  if (categoryKey === "goldenBoot") {
    if (leaders.scorers.length === 0) {
      return <p className="text-xs text-gray-500">No goals scored yet</p>;
    }
    return (
      <div className="space-y-2">
        {leaders.scorers.map((s, i) => {
          const team = getTeamByCode(s.teamTla);
          const label = team
            ? `${s.playerName} (${team.flag} ${team.code})`
            : `${s.playerName} (${s.teamTla})`;
          const isPicked = pickedValues.has(s.playerName);
          return (
            <div key={s.playerName} className="flex items-center gap-2">
              <span className={`text-xs font-bold ${i === 0 ? "text-gold" : "text-gray-400"}`}>
                {i + 1}.
              </span>
              <span className={`text-sm ${i === 0 ? "text-gold font-medium" : "text-white"}`}>
                {label}
              </span>
              <span className="text-xs text-gray-500">
                {s.goals} {s.goals === 1 ? "goal" : "goals"}
              </span>
              {isPicked && <LeaderBadge />}
            </div>
          );
        })}
      </div>
    );
  }

  if (categoryKey === "mostGoalsTeam") {
    if (leaders.teamsByGoals.length === 0) {
      return <p className="text-xs text-gray-500">No matches played yet</p>;
    }
    return (
      <div className="space-y-2">
        {leaders.teamsByGoals.map((t, i) => {
          const team = getTeamByCode(t.teamTla);
          const label = team ? `${team.flag} ${team.name}` : t.teamName;
          const isPicked = pickedValues.has(t.teamTla);
          return (
            <div key={t.teamTla} className="flex items-center gap-2">
              <span className={`text-xs font-bold ${i === 0 ? "text-gold" : "text-gray-400"}`}>
                {i + 1}.
              </span>
              <span className={`text-sm ${i === 0 ? "text-gold font-medium" : "text-white"}`}>
                {label}
              </span>
              <span className="text-xs text-gray-500">
                {t.goalsScored} {t.goalsScored === 1 ? "goal" : "goals"}
              </span>
              {isPicked && <LeaderBadge />}
            </div>
          );
        })}
      </div>
    );
  }

  if (categoryKey === "fewestConcededTeam") {
    if (leaders.teamsByConceded.length === 0) {
      return <p className="text-xs text-gray-500">No matches played yet</p>;
    }
    return (
      <div className="space-y-2">
        {leaders.teamsByConceded.map((t, i) => {
          const team = getTeamByCode(t.teamTla);
          const label = team ? `${team.flag} ${team.name}` : t.teamName;
          const isPicked = pickedValues.has(t.teamTla);
          return (
            <div key={t.teamTla} className="flex items-center gap-2">
              <span className={`text-xs font-bold ${i === 0 ? "text-gold" : "text-gray-400"}`}>
                {i + 1}.
              </span>
              <span className={`text-sm ${i === 0 ? "text-gold font-medium" : "text-white"}`}>
                {label}
              </span>
              <span className="text-xs text-gray-500">
                {t.goalsConceded} conceded
              </span>
              {isPicked && <LeaderBadge />}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

export default function BonusPicksComparison() {
  const [participants, setParticipants] = useState<ParticipantPicks[]>([]);
  const [loading, setLoading] = useState(true);
  const { leaders, loading: leadersLoading } = useActualLeaders();

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
      getRawValue: (p: ParticipantPicks) => p.picks?.goldenBoot ?? "",
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
      getRawValue: (p: ParticipantPicks) => p.picks?.mostGoalsTeam ?? "",
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
      getRawValue: (p: ParticipantPicks) => p.picks?.fewestConcededTeam ?? "",
    },
    {
      key: "goldenBall" as const,
      label: "Golden Ball",
      icon: "🌟",
      tier: 2,
      getValue: (p: ParticipantPicks) => p.picks?.goldenBall ?? "",
      getRawValue: (p: ParticipantPicks) => p.picks?.goldenBall ?? "",
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
            const pickedRawValues = new Set<string>();
            for (const p of withPicks) {
              const val = cat.getValue(p);
              const rawVal = cat.getRawValue(p);
              if (val) {
                if (!pickDistribution[val]) pickDistribution[val] = [];
                pickDistribution[val].push(p.name);
              }
              if (rawVal) {
                pickedRawValues.add(rawVal);
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">
                      Picks Distribution
                    </h4>
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
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">
                      {cat.key === "goldenBall" ? "Award Status" : "Current Leaders"}
                    </h4>
                    {leadersLoading ? (
                      <p className="text-xs text-gray-500">Loading...</p>
                    ) : (
                      <ActualLeaderColumn
                        categoryKey={cat.key}
                        leaders={leaders}
                        pickedValues={pickedRawValues}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
