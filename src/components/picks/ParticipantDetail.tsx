"use client";

import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode, groupLabels } from "@/data/teams";
import type { ParticipantPicks } from "@/lib/picks-types";

export default function ParticipantDetail({ participant }: { participant: ParticipantPicks }) {
  if (!participant.hasPicks) return null;

  return (
    <Card hover>
      <CardHeader>
        <h3 className="font-heading text-base font-bold text-white">{participant.name}</h3>
        {participant.picks ? (
          <p className="text-xs text-gray-500">
            Tiebreaker: {participant.picks.tiebreaker.homeScore} : {participant.picks.tiebreaker.awayScore}
          </p>
        ) : (
          <p className="text-xs text-gray-500">Picks submitted</p>
        )}
      </CardHeader>
      <CardBody>
        {participant.picks ? (
          <>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Group Winners
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {groupLabels.map((group) => {
                  const gp = participant.picks?.groupPredictions?.find((g) => g.group === group);
                  const winnerCode = gp ? gp.order[0] : null;
                  const winner = winnerCode ? getTeamByCode(winnerCode) : null;
                  return (
                    <div key={group} className="text-center rounded bg-navy-lighter/50 px-1 py-1.5 border border-white/5">
                      <p className="text-[10px] text-gray-600 mb-0.5">{group}</p>
                      <span className="text-sm">{winner?.flag ?? "?"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Bonus Picks
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>👟 Golden Boot</span>
                  <span className="text-white">{participant.picks.goldenBoot || "Not set"}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>⚽ Most Goals</span>
                  <span className="text-white">
                    {(() => {
                      const t = getTeamByCode(participant.picks?.mostGoalsTeam ?? "");
                      return t ? `${t.flag} ${t.name}` : participant.picks?.mostGoalsTeam || "Not set";
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>🛡️ Fewest Conceded</span>
                  <span className="text-white">
                    {(() => {
                      const t = getTeamByCode(participant.picks?.fewestConcededTeam ?? "");
                      return t ? `${t.flag} ${t.name}` : participant.picks?.fewestConcededTeam || "Not set";
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-2xl block mb-2" aria-hidden>🔒</span>
            <p className="text-xs text-gray-500">Picks hidden until the tournament begins</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
