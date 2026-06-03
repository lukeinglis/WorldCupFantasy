"use client";

import { useState, useEffect } from "react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode, groupLabels } from "@/data/teams";
import PicksTabs from "@/components/PicksTabs";
import { useAuth } from "@/components/AuthProvider";
import {
  areTier1PicksRevealed,
  areTier2PicksRevealed,
  TOURNAMENT_START,
  KNOCKOUT_START,
  formatRevealDate,
} from "@/lib/tournament-dates";

interface ParticipantPicks {
  id: string;
  name: string;
  hasPicks: boolean;
  picks: {
    groupPredictions: { group: string; order: [string, string, string, string] }[];
    goldenBoot: string;
    mostGoalsTeam: string;
    fewestConcededTeam: string;
    goldenBall: string;
    tiebreaker: { homeScore: number; awayScore: number };
    submittedAt: string;
  } | null;
}

function HiddenPicksBanner({ revealDate, tier }: { revealDate: Date; tier: number }) {
  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardBody className="py-12 text-center">
        <span className="text-5xl block mb-4" aria-hidden>🔒</span>
        <h3 className="font-heading text-xl font-bold text-white mb-2">
          Tier {tier} Picks Are Hidden
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Picks will be revealed when {tier === 1 ? "the tournament begins" : "the knockout stage begins"} on{" "}
          <span className="text-gold font-medium">{formatRevealDate(revealDate)}</span>.
          Each participant can only see their own picks until then.
        </p>
      </CardBody>
    </Card>
  );
}

function ParticipantRoster({ participants }: { participants: ParticipantPicks[] }) {
  const withPicks = participants.filter((p) => p.hasPicks);
  const withoutPicks = participants.filter((p) => !p.hasPicks);

  return (
    <Card className="border-accent/20">
      <CardBody className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" aria-hidden>👥</span>
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
              Who&apos;s In
            </h3>
            <p className="text-xs text-gray-500">
              {withPicks.length} submitted picks{withoutPicks.length > 0 ? `, ${withoutPicks.length} still deciding` : ""}
            </p>
          </div>
        </div>
        {withPicks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {withPicks.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 text-sm font-medium text-accent"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {p.name}
              </span>
            ))}
          </div>
        )}
        {withoutPicks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {withoutPicks.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-500"
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function GroupPredictionGrid({ group, participantsList, picksRevealed }: { group: string; participantsList: ParticipantPicks[]; picksRevealed: boolean }) {
  const withPicks = participantsList.filter(
    (p) => p.hasPicks && (picksRevealed ? p.picks?.groupPredictions?.find((g) => g.group === group) : true)
  );

  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
          Group {group}
        </h3>
      </CardHeader>
      <CardBody className="p-0">
        {withPicks.length === 0 ? (
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
                {withPicks.map((p) => {
                  const gp = p.picks?.groupPredictions?.find((g) => g.group === group);

                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2">
                        <span className="text-xs text-gray-400 truncate max-w-[80px]">{p.name}</span>
                      </td>
                      {gp ? gp.order.map((code, i) => {
                        const team = getTeamByCode(code);
                        const isAdvancing = i <= 1;
                        return (
                          <td
                            key={`${p.id}-${group}-${i}`}
                            className={`px-2 py-2 text-center ${isAdvancing ? "bg-pitch/5" : ""}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{team?.flag ?? ""}</span>
                              <span className="text-xs text-gray-400 font-mono">{code}</span>
                            </div>
                          </td>
                        );
                      }) : (
                        <td colSpan={4} className="px-2 py-2 text-center">
                          <span className="text-xs text-gray-600">🔒 Hidden until kickoff</span>
                        </td>
                      )}
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

function BonusPicksSection({ participantsList, picksRevealed }: { participantsList: ParticipantPicks[]; picksRevealed: boolean }) {
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
        // Hide tier 2 bonus picks until knockout
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

function ParticipantDetail({ participant }: { participant: ParticipantPicks }) {
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

export default function PicksPage() {
  const { user } = useAuth();
  const [participantsList, setParticipantsList] = useState<ParticipantPicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [kvConfigured, setKvConfigured] = useState(true);

  const tier1Revealed = areTier1PicksRevealed();

  useEffect(() => {
    async function fetchParticipants() {
      try {
        const url = user ? `/api/participants?userId=${user.id}` : "/api/participants";
        const res = await fetch(url);
        const data = await res.json();
        setKvConfigured(data.kvConfigured !== false);
        setParticipantsList(data.participants ?? []);
      } catch {
        // Silently fail, show empty state
      }
      setLoading(false);
    }
    fetchParticipants();
  }, [user]);

  // All participants with picks are visible (names always shown, pick details gated by reveal)
  const visibleParticipants = participantsList.filter((p) => p.hasPicks);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Everyone&apos;s Picks"
          subtitle="Group predictions, bonus picks, and knockout brackets."
          icon="📋"
        />
        <section className="py-10 sm:py-14">
          <Container>
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Loading picks...</p>
            </div>
          </Container>
        </section>
      </>
    );
  }

  // Show hidden banner if picks exist but aren't revealed yet
  const hasHiddenPicks = !tier1Revealed && participantsList.some((p) => p.hasPicks);

  return (
    <>
      <PageHeader
        title="Everyone&apos;s Picks"
        subtitle="Group predictions, bonus picks, and knockout brackets."
        icon="📋"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {!kvConfigured && (
            <div className="mb-6 rounded-lg border border-gold/20 bg-gold/5 px-5 py-4 text-center">
              <p className="text-sm text-gold font-medium">
                Storage is not configured yet. Picks will appear here once the administrator sets up Vercel KV.
              </p>
            </div>
          )}

          {hasHiddenPicks && (
            <div className="mb-8 space-y-6">
              <HiddenPicksBanner revealDate={TOURNAMENT_START} tier={1} />
              <ParticipantRoster participants={participantsList} />
            </div>
          )}

          <PicksTabs
            groupContent={
              <div className="space-y-10">
                <div>
                  <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
                    Group Finishing Order Predictions
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    {tier1Revealed
                      ? "Each participant predicted the finishing order for all 12 groups. Green shading = predicted to advance (1st/2nd)."
                      : "Specific picks will be revealed when the tournament begins. You can see your own picks below."}
                  </p>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {groupLabels.map((group) => (
                      <GroupPredictionGrid key={group} group={group} participantsList={visibleParticipants} picksRevealed={tier1Revealed} />
                    ))}
                  </div>
                </div>
              </div>
            }
            bonusContent={
              <BonusPicksSection participantsList={visibleParticipants} picksRevealed={tier1Revealed} />
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
              visibleParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3" aria-hidden>👤</span>
                  <p className="text-gray-400 text-sm">No participants have submitted picks yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {visibleParticipants.map((p) => (
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
