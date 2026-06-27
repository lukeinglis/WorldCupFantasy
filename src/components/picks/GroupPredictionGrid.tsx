"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode } from "@/data/teams";
import type { ParticipantPicks, GroupStanding } from "@/lib/picks-types";

export default function GroupPredictionGrid({
  group,
  participantsList,
  picksRevealed,
  standings,
  currentUserId,
}: {
  group: string;
  participantsList: ParticipantPicks[];
  picksRevealed: boolean;
  standings?: GroupStanding[];
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const withPicks = participantsList.filter(
    (p) => p.hasPicks && (picksRevealed ? p.picks?.groupPredictions?.find((g) => g.group === group) : true)
  );

  const actualOrder = standings
    ? [...standings].sort((a, b) => a.position - b.position).map((s) => s.team.tla)
    : null;
  const isGroupComplete = standings
    ? standings.length >= 4 && standings.every((s) => s.played >= 3)
    : false;

  const consensus: (string | null)[] = [null, null, null, null];
  const consensusCounts: (number | null)[] = [null, null, null, null];
  if (picksRevealed && withPicks.length > 0) {
    for (let pos = 0; pos < 4; pos++) {
      const counts: Record<string, number> = {};
      for (const p of withPicks) {
        const gp = p.picks?.groupPredictions?.find((g) => g.group === group);
        if (gp?.order[pos]) {
          counts[gp.order[pos]] = (counts[gp.order[pos]] ?? 0) + 1;
        }
      }
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        consensus[pos] = top[0];
        consensusCounts[pos] = top[1];
      }
    }
  }

  const currentUser = currentUserId
    ? withPicks.find((p) => p.id === currentUserId)
    : null;
  const userPicks = currentUser?.picks?.groupPredictions?.find(
    (g) => g.group === group
  );

  function pickMatchesActual(pickCode: string, position: number): boolean | null {
    if (!actualOrder || !actualOrder[position]) return null;
    return actualOrder[position] === pickCode;
  }

  function renderTeamCell(code: string, position: number, showScoring: boolean) {
    const team = getTeamByCode(code);
    const match = showScoring ? pickMatchesActual(code, position) : null;
    const bgClass = match === true
      ? "bg-accent/10"
      : match === false
      ? "bg-red-500/10"
      : "";

    return (
      <td key={`${code}-${position}`} className={`px-2 py-2 text-center ${bgClass}`}>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base">{team?.flag ?? ""}</span>
          <span className="text-xs text-gray-400 font-mono">{code}</span>
        </div>
      </td>
    );
  }

  const hasData = picksRevealed && withPicks.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
            Group {group}
          </h3>
          {actualOrder && (
            <span className={`text-xs font-medium ${isGroupComplete ? "text-accent" : "text-gold"}`}>
              {isGroupComplete ? "Final" : "In Progress"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {!hasData && !actualOrder ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-500">No data available yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-left w-28">
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                      1st
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                      2nd
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 text-center">
                      3rd
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 text-center">
                      4th
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actualOrder && (
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold text-gray-300">Actual</span>
                      </td>
                      {actualOrder.slice(0, 4).map((code, i) => {
                        const team = getTeamByCode(code);
                        return (
                          <td key={`actual-${i}`} className="px-2 py-2 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{team?.flag ?? ""}</span>
                              <span className="text-xs text-white font-mono font-bold">{code}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {picksRevealed && consensus[0] && (
                    <tr className="border-b border-white/10">
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold text-gray-400">Consensus</span>
                      </td>
                      {consensus.map((code, i) => {
                        if (!code) return <td key={`cons-${i}`} className="px-2 py-2" />;
                        const team = getTeamByCode(code);
                        const match = actualOrder ? actualOrder[i] === code : null;
                        const bgClass = match === true ? "bg-accent/10" : match === false ? "bg-red-500/10" : "";
                        return (
                          <td key={`cons-${i}`} className={`px-2 py-2 text-center ${bgClass}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{team?.flag ?? ""}</span>
                              <span className="text-xs text-gray-400 font-mono">{code}</span>
                              <span className="text-[10px] text-gray-600">
                                {consensusCounts[i]}/{withPicks.length}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {userPicks && (
                    <tr className="border-b border-white/10">
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold text-accent">You</span>
                      </td>
                      {userPicks.order.map((code, i) =>
                        renderTeamCell(code, i, !!actualOrder)
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasData && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors border-t border-white/5"
                >
                  <span>{expanded ? "Hide" : "Show"} all {withPicks.length} picks</span>
                  <span>{expanded ? "▲" : "▼"}</span>
                </button>

                {expanded && (
                  <div className="overflow-x-auto border-t border-white/5">
                    <table className="w-full text-sm">
                      <tbody>
                        {withPicks.map((p) => {
                          const gp = p.picks?.groupPredictions?.find((g) => g.group === group);
                          return (
                            <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-2 w-28">
                                <span className={`text-xs truncate max-w-[80px] ${p.id === currentUserId ? "text-accent font-medium" : "text-gray-400"}`}>
                                  {p.name}
                                </span>
                              </td>
                              {gp ? gp.order.map((code, i) =>
                                renderTeamCell(code, i, !!actualOrder)
                              ) : (
                                <td colSpan={4} className="px-2 py-2 text-center">
                                  <span className="text-xs text-gray-600">🔒 Hidden</span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
