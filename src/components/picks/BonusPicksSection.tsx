"use client";

import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode } from "@/data/teams";
import {
  areTier2PicksRevealed,
  KNOCKOUT_START,
  formatRevealDate,
} from "@/lib/tournament-dates";
import type { ParticipantPicks } from "@/lib/picks-types";

export default function BonusPicksSection({ participantsList, picksRevealed }: { participantsList: ParticipantPicks[]; picksRevealed: boolean }) {
  const withPicks = participantsList.filter((p) => picksRevealed ? p.picks : p.hasPicks);

  const bonusCategories = [
    {
      key: "goldenBoot" as const,
      label: "Golden Boot",
      icon: "👟",
      tier: 1,
      scope: "Tournament top scorer",
      getValue: (p: ParticipantPicks) => p.picks?.goldenBoot ?? "",
    },
    {
      key: "mostGoalsTeam" as const,
      label: "Most Goals (Team)",
      icon: "⚽",
      tier: 1,
      scope: "Group stage only",
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
      scope: "Group stage only",
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
      scope: "Best player of tournament",
      getValue: (p: ParticipantPicks) => p.picks?.goldenBall ?? "",
    },
  ];

  const tier2Revealed = areTier2PicksRevealed();

  return (
    <div className="space-y-6">
      {bonusCategories.map((cat) => {
        if (cat.tier === 2 && !tier2Revealed) {
          return (
            <Card key={cat.key} className="border-gold/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-gray-500">
                      <span className="text-gold">Tier 2</span> {" · "}{cat.scope}{" · "}10 points
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="py-8 text-center">
                <span className="text-3xl block mb-2" aria-hidden>🔒</span>
                <p className="text-xs text-gray-500">
                  Revealed when the knockout stage begins on {formatRevealDate(KNOCKOUT_START)}.
                </p>
              </CardBody>
            </Card>
          );
        }

        return (
          <Card key={cat.key} className={cat.tier === 1 ? "border-accent/10" : "border-gold/10"}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-gray-500">
                    <span className={cat.tier === 1 ? "text-accent" : "text-gold"}>Tier {cat.tier}</span>
                    {" · "}{cat.scope}{" · "}10 points
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {withPicks.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-gray-500">No picks submitted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {withPicks.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-5 py-3 border-b border-r border-white/5 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{p.name}</p>
                        <p className="text-sm font-medium text-white truncate mt-0.5">
                          {p.picks ? (cat.getValue(p) || "Not set") : "🔒 Hidden"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
