import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { participants } from "@/data/participants";
import { getTeamByCode, groupLabels } from "@/data/teams";
import PicksTabs from "@/components/PicksTabs";

export const metadata: Metadata = {
  title: "Picks",
  description: "See everyone's group predictions, knockout brackets, and bonus picks.",
};

function GroupPredictionGrid({ group }: { group: string }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
          Group {group}
        </h3>
      </CardHeader>
      <CardBody className="p-0">
        {participants.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-500">No predictions submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-left">
                    Player
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
                {participants.map((p) => {
                  const gp = p.groupPredictions.find(g => g.group === group);
                  if (!gp) return null;

                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{p.avatar}</span>
                          <span className="text-xs text-gray-400 truncate max-w-[80px]">{p.name}</span>
                        </div>
                      </td>
                      {gp.order.map((code, i) => {
                        const team = getTeamByCode(code);
                        const isAdvancing = i <= 1;
                        return (
                          <td
                            key={`${p.id}-${i}`}
                            className={`px-2 py-2 text-center ${isAdvancing ? "bg-pitch/5" : ""}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{team?.flag ?? ""}</span>
                              <span className="text-xs text-gray-400 font-mono">{code}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function BonusPicksSection() {
  const bonusCategories = [
    {
      key: "goldenBoot" as const,
      label: "Golden Boot",
      icon: "👟",
      tier: 1,
      scope: "Tournament top scorer",
      getValue: (p: typeof participants[0]) => p.bonusPicks.goldenBoot,
    },
    {
      key: "mostGoalsTeam" as const,
      label: "Most Goals (Team)",
      icon: "⚽",
      tier: 1,
      scope: "Group stage only",
      getValue: (p: typeof participants[0]) => {
        const team = getTeamByCode(p.bonusPicks.mostGoalsTeam);
        return team ? `${team.flag} ${team.name}` : p.bonusPicks.mostGoalsTeam;
      },
    },
    {
      key: "fewestConcededTeam" as const,
      label: "Fewest Conceded (Team)",
      icon: "🛡️",
      tier: 1,
      scope: "Group stage only",
      getValue: (p: typeof participants[0]) => {
        const team = getTeamByCode(p.bonusPicks.fewestConcededTeam);
        return team ? `${team.flag} ${team.name}` : p.bonusPicks.fewestConcededTeam;
      },
    },
    {
      key: "goldenBall" as const,
      label: "Golden Ball",
      icon: "🌟",
      tier: 2,
      scope: "Best player of tournament",
      getValue: (p: typeof participants[0]) => p.bonusPicks.goldenBall,
    },
  ];

  return (
    <div className="space-y-6">
      {bonusCategories.map((cat) => (
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
            {participants.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-gray-500">No picks submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-r border-white/5 last:border-b-0"
                  >
                    <span className="text-lg">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{p.name}</p>
                      <p className="text-sm font-medium text-white truncate mt-0.5">
                        {cat.getValue(p)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function ParticipantDetail({ participant }: { participant: typeof participants[0] }) {
  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{participant.avatar}</span>
          <div>
            <h3 className="font-heading text-base font-bold text-white">{participant.name}</h3>
            <p className="text-xs text-gray-500">
              Tiebreaker: {participant.tiebreaker.homeScore} : {participant.tiebreaker.awayScore}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {/* Group Predictions Summary */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Group Winners
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {groupLabels.map((group) => {
              const gp = participant.groupPredictions.find(g => g.group === group);
              const winner = gp ? getTeamByCode(gp.order[0]) : null;
              return (
                <div key={group} className="text-center rounded bg-navy-lighter/50 px-1 py-1.5 border border-white/5">
                  <p className="text-[10px] text-gray-600 mb-0.5">{group}</p>
                  <span className="text-sm">{winner?.flag ?? "?"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus Picks */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Bonus Picks
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>👟 Golden Boot</span>
              <span className="text-white">{participant.bonusPicks.goldenBoot}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>⚽ Most Goals</span>
              <span className="text-white">{getTeamByCode(participant.bonusPicks.mostGoalsTeam)?.flag} {getTeamByCode(participant.bonusPicks.mostGoalsTeam)?.name}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>🛡️ Fewest Conceded</span>
              <span className="text-white">{getTeamByCode(participant.bonusPicks.fewestConcededTeam)?.flag} {getTeamByCode(participant.bonusPicks.fewestConcededTeam)?.name}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>🌟 Golden Ball</span>
              <span className="text-white">{participant.bonusPicks.goldenBall}</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function PicksPage() {
  return (
    <>
      <PageHeader
        title="Everyone&apos;s Picks"
        subtitle="Group predictions, bonus picks, and knockout brackets."
        icon="📋"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <PicksTabs
            groupContent={
              <div className="space-y-10">
                {/* Group Prediction Grids */}
                <div>
                  <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
                    Group Finishing Order Predictions
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Each participant predicted the finishing order for all 12 groups. Green shading = predicted to advance (1st/2nd).
                  </p>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {groupLabels.map((group) => (
                      <GroupPredictionGrid key={group} group={group} />
                    ))}
                  </div>
                </div>
              </div>
            }
            bonusContent={
              <BonusPicksSection />
            }
            bracketContent={
              <Card className="border-gold/20 bg-gold/5">
                <CardBody className="py-12 text-center">
                  <span className="text-5xl block mb-4" aria-hidden>🔒</span>
                  <h3 className="font-heading text-xl font-bold text-white mb-2">
                    Knockout Bracket Not Yet Available
                  </h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    The knockout bracket will be available after the group stage ends on June 27, 2026.
                    Tier 2 picks must be submitted before the Round of 32 begins on June 28.
                  </p>
                </CardBody>
              </Card>
            }
            participantsContent={
              participants.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3" aria-hidden>👤</span>
                  <p className="text-gray-400 text-sm">No participants yet. Individual picks will appear here once contestants join the contest.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {participants.map((p) => (
                    <ParticipantDetail key={p.id} participant={p} />
                  ))}
                </div>
              )
            }
          />
        </Container>
      </section>
    </>
  );
}
