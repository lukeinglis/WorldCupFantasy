"use client";

import { useAuth } from "@/components/AuthProvider";
import { usePicksData } from "@/hooks/usePicksData";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode } from "@/data/teams";
import { knockoutRoundPoints } from "@/data/participants";
import { R32_MATCHES } from "@/data/knockout-bracket";

const ROUND_LABELS: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  third_place: "Third Place",
  final: "Final",
};

const ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];

interface KnockoutPick {
  round: string;
  matchNumber: number;
  winner: string;
}

export default function KnockoutBracketSection() {
  const { user } = useAuth();
  const { participantsList, loading } = usePicksData();

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Loading knockout picks...</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPicks = (p: typeof participantsList[number]) => p.picks as any;

  const currentUser = user ? participantsList.find((p) => p.id === user.id) : null;
  const currentUserHasTier2 = currentUser ? !!getPicks(currentUser)?.tier2Submitted : false;

  if (!user || !currentUserHasTier2) {
    return (
      <Card className="border-gold/20 bg-gold/5">
        <CardBody className="py-12 text-center">
          <span className="text-5xl block mb-4" aria-hidden>🔒</span>
          <h3 className="font-heading text-xl font-bold text-white mb-2">
            Submit Your Picks First
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            You need to submit your knockout bracket picks before you can see what others have picked.
            Head to My Picks to fill out your bracket.
          </p>
        </CardBody>
      </Card>
    );
  }

  const withTier2 = participantsList.filter((p) => {
    const picks = getPicks(p);
    return picks?.tier2Submitted && Array.isArray(picks?.knockoutPicks);
  });

  if (withTier2.length === 0) {
    return (
      <Card className="border-gold/20 bg-gold/5">
        <CardBody className="py-12 text-center">
          <span className="text-4xl block mb-3" aria-hidden>📋</span>
          <p className="text-gray-400 text-sm">No one has submitted knockout picks yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 text-center">
        <p className="text-sm text-gold font-medium">
          {withTier2.length} participant{withTier2.length !== 1 ? "s have" : " has"} submitted knockout picks
        </p>
      </div>

      {ROUND_ORDER.map((round) => {
        const matchCount = round === "round_of_32" ? 16 : round === "round_of_16" ? 8 : round === "quarter" ? 4 : round === "semi" ? 2 : 1;
        const pts = knockoutRoundPoints[round] ?? 0;

        return (
          <div key={round}>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white mb-3">
              {ROUND_LABELS[round]}{" "}
              <span className="text-sm font-normal text-gray-500">({pts} pts each)</span>
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: matchCount }, (_, i) => i + 1).map((matchNumber) => {
                const r32 = round === "round_of_32" ? R32_MATCHES.find((m) => m.matchNumber === matchNumber) : null;
                const homeTeam = r32?.homeTeam ? getTeamByCode(r32.homeTeam) : null;
                const awayTeam = r32?.awayTeam ? getTeamByCode(r32.awayTeam) : null;

                const pickCounts: Record<string, { count: number; names: string[] }> = {};
                for (const p of withTier2) {
                  const ko = (getPicks(p).knockoutPicks ?? []) as KnockoutPick[];
                  const pick = ko.find((k) => k.round === round && k.matchNumber === matchNumber);
                  if (pick) {
                    if (!pickCounts[pick.winner]) pickCounts[pick.winner] = { count: 0, names: [] };
                    pickCounts[pick.winner].count++;
                    pickCounts[pick.winner].names.push(p.name);
                  }
                }

                const sortedPicks = Object.entries(pickCounts).sort((a, b) => b[1].count - a[1].count);

                return (
                  <Card key={`${round}_${matchNumber}`}>
                    <CardHeader className="py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                          Match {matchNumber}
                        </span>
                        {r32 && (
                          <span className="text-xs text-gray-400">
                            {homeTeam?.flag} {r32.homeTeam} vs {awayTeam?.flag} {r32.awayTeam}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody className="py-2 space-y-1">
                      {sortedPicks.length === 0 ? (
                        <p className="text-xs text-gray-600 italic">No picks</p>
                      ) : (
                        sortedPicks.map(([teamCode, { count }]) => {
                          const team = getTeamByCode(teamCode);
                          const pct = Math.round((count / withTier2.length) * 100);
                          return (
                            <div key={teamCode} className="flex items-center gap-2">
                              <span className="text-sm">{team?.flag ?? "🏳️"}</span>
                              <span className="text-xs font-bold text-gray-200">{teamCode}</span>
                              <div className="flex-1 h-1.5 bg-navy-lighter rounded-full overflow-hidden">
                                <div className="h-full bg-gold/60 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-500 w-8 text-right">{count}</span>
                            </div>
                          );
                        })
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
