import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { getUserById, getPicks, getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import {
  calculateAllPoints,
  setActualGroupResults,
  setActualBonusResults,
  actualGroupResults,
} from "@/data/scoring";
import { isApiConfigured } from "@/lib/football-api";
import { getLiveGroupResults, getLiveBonusResults } from "@/lib/live-scoring";
import { getTeamByCode, groupLabels } from "@/data/teams";
import {
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
  knockoutRoundPoints,
} from "@/data/participants";
import {
  areTier1PicksRevealed,
  areTier2PicksRevealed,
  TOURNAMENT_START,
  KNOCKOUT_START,
  formatRevealDate,
} from "@/lib/tournament-dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;
  if (!isKvConfigured()) return { title: "Participant" };
  const user = await getUserById(participantId);
  return {
    title: user ? `${user.name} | Leaderboard` : "Participant Not Found",
  };
}

const knockoutRoundLabels: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarter-Finals",
  semi: "Semi-Finals",
  third_place: "Third Place",
  final: "Final",
};

const knockoutRoundOrder = [
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;

  if (!isKvConfigured()) return notFound();

  const [user, picks] = await Promise.all([
    getUserById(participantId),
    getPicks(participantId),
  ]);

  if (!user) return notFound();

  const kvData = await getAllUsersWithPicks();
  const participants = buildParticipantsFromKv(kvData);

  if (isApiConfigured()) {
    const [groupResults, bonusResults] = await Promise.all([
      getLiveGroupResults(),
      getLiveBonusResults(),
    ]);
    if (groupResults) setActualGroupResults(groupResults.groups);
    if (bonusResults) setActualBonusResults(bonusResults);
  }

  const withPoints = calculateAllPoints(participants);

  const sorted = [...withPoints].sort((a, b) => {
    const totalDiff = b.calculatedPoints.total - a.calculatedPoints.total;
    if (totalDiff !== 0) return totalDiff;
    const tier1Diff =
      b.calculatedPoints.tier1Groups +
      b.calculatedPoints.tier1Bonus -
      (a.calculatedPoints.tier1Groups + a.calculatedPoints.tier1Bonus);
    if (tier1Diff !== 0) return tier1Diff;
    return a.name.localeCompare(b.name);
  });

  const ranked = sorted.map((p, i) => ({
    ...p,
    rank: i + 1,
    tier1Total: p.calculatedPoints.tier1Groups + p.calculatedPoints.tier1Bonus,
    tier2Total: p.calculatedPoints.tier2Bracket + p.calculatedPoints.tier2Bonus,
  }));

  const thisParticipant = ranked.find((p) => p.id === participantId);
  const rank = thisParticipant?.rank ?? ranked.length;
  const tier1Total = thisParticipant?.tier1Total ?? 0;
  const tier2Total = thisParticipant?.tier2Total ?? 0;
  const totalPoints = thisParticipant?.calculatedPoints.total ?? 0;

  const tier1Revealed = areTier1PicksRevealed();
  const tier2Revealed = areTier2PicksRevealed();

  const bonusPicks = picks
    ? {
        goldenBoot: picks.goldenBoot ?? "",
        mostGoalsTeam: picks.mostGoalsTeam ?? "",
        fewestConcededTeam: picks.fewestConcededTeam ?? "",
        goldenBall: picks.goldenBall ?? "",
      }
    : null;

  const groupPredictions = picks?.groupPredictions ?? [];
  const knockoutPicks = picks?.knockoutPicks ?? [];
  const tiebreaker = picks?.tiebreaker ?? { homeScore: 0, awayScore: 0 };

  return (
    <>
      <PageHeader title={user.name} subtitle="Picks breakdown and scoring detail" icon="👤" />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="mb-6">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              &larr; Back to Leaderboard
            </Link>
          </div>

          {/* Score Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
            <Card className="border-accent/20">
              <CardBody>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">
                  Tier 1: Group Stage
                </p>
                <p className="font-heading text-3xl font-bold text-white">
                  {tier1Total}
                  <span className="text-lg text-gray-500">/{TIER1_MAX}</span>
                </p>
              </CardBody>
            </Card>
            <Card className="border-gold/20">
              <CardBody>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                  Tier 2: Knockout Bracket
                </p>
                <p className="font-heading text-3xl font-bold text-white">
                  {tier2Total}
                  <span className="text-lg text-gray-500">/{TIER2_MAX}</span>
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Overall
                </p>
                <p className="font-heading text-3xl font-bold text-white">
                  #{rank}{" "}
                  <span className="text-lg text-gray-500">
                    of {ranked.length}
                  </span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {totalPoints}/{OVERALL_MAX} pts
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Bonus Picks Banner */}
          {bonusPicks && tier1Revealed && (
            <Card className="mb-10">
              <CardHeader>
                <h2 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                  Bonus Picks
                </h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:divide-x sm:divide-white/10">
                  <BonusItem
                    label="Golden Boot"
                    tier="T1"
                    tierColor="accent"
                    value={bonusPicks.goldenBoot || "Not set"}
                  />
                  <BonusItem
                    label="Most Goals Team"
                    tier="T1"
                    tierColor="accent"
                    value={renderTeam(bonusPicks.mostGoalsTeam)}
                  />
                  <BonusItem
                    label="Fewest Conceded"
                    tier="T1"
                    tierColor="accent"
                    value={renderTeam(bonusPicks.fewestConcededTeam)}
                  />
                  {tier2Revealed ? (
                    <BonusItem
                      label="Golden Ball"
                      tier="T2"
                      tierColor="gold"
                      value={bonusPicks.goldenBall || "Not set"}
                    />
                  ) : (
                    <BonusItem
                      label="Golden Ball"
                      tier="T2"
                      tierColor="gold"
                      value={
                        <span className="flex items-center gap-1 text-gray-500">
                          🔒 Hidden until {formatRevealDate(KNOCKOUT_START)}
                        </span>
                      }
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {!tier1Revealed && (
            <Card className="mb-10">
              <CardBody className="text-center py-8">
                <span className="text-3xl block mb-2">🔒</span>
                <p className="text-gray-400">
                  Bonus picks are hidden until the tournament starts on{" "}
                  {formatRevealDate(TOURNAMENT_START)}.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Knockout Bracket */}
          <div className="mb-10">
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
              Knockout Bracket
            </h2>
            {tier2Revealed ? (
              knockoutPicks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {knockoutRoundOrder.map((round) => {
                    const roundPicks = knockoutPicks.filter(
                      (kp) => kp.round === round
                    );
                    if (roundPicks.length === 0) return null;
                    const pts = knockoutRoundPoints[round] ?? 0;
                    return (
                      <Card key={round}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-white">
                              {knockoutRoundLabels[round] ?? round}
                            </h3>
                            <span className="text-xs text-gold">{pts} pts each</span>
                          </div>
                        </CardHeader>
                        <CardBody className="space-y-2">
                          {roundPicks
                            .sort((a, b) => a.matchNumber - b.matchNumber)
                            .map((kp) => {
                              const team = getTeamByCode(kp.winner);
                              return (
                                <div
                                  key={`${kp.round}-${kp.matchNumber}`}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-xs text-gray-600 w-5">
                                    {kp.matchNumber}.
                                  </span>
                                  <span className="text-lg">
                                    {team?.flag ?? "🏳️"}
                                  </span>
                                  <span className="text-sm text-white">
                                    {team?.name ?? kp.winner}
                                  </span>
                                </div>
                              );
                            })}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No knockout picks submitted yet.
                    </p>
                  </CardBody>
                </Card>
              )
            ) : (
              <Card>
                <CardBody className="text-center py-8">
                  <span className="text-3xl block mb-2">🔒</span>
                  <p className="text-gray-400">
                    Knockout picks are hidden until{" "}
                    {formatRevealDate(KNOCKOUT_START)}.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Group Predictions */}
          <div className="mb-10">
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
              Group Predictions
            </h2>
            {tier1Revealed ? (
              groupPredictions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupLabels.map((groupId) => {
                    const gp = groupPredictions.find(
                      (g) => g.group === groupId
                    );
                    if (!gp) return null;
                    const actual = actualGroupResults?.[groupId] ?? null;
                    let groupPts = 0;
                    if (actual) {
                      for (let i = 0; i < gp.order.length; i++) {
                        const actualPos = actual.indexOf(gp.order[i]);
                        if (actualPos === i) groupPts += 3;
                        else if (actualPos !== -1 && (i <= 1) === (actualPos <= 1)) groupPts += 1;
                      }
                    }
                    return (
                      <Card key={groupId}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-white">
                              Group {groupId}
                            </h3>
                            {actual && (
                              <span className={`text-xs font-bold ${groupPts >= 8 ? "text-green-400" : groupPts >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                                {groupPts}/12
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardBody className="space-y-1.5">
                          {gp.order.map((code, i) => {
                            const team = getTeamByCode(code);
                            let status: "correct" | "bucket" | "wrong" | null =
                              null;
                            if (actual) {
                              const actualPos = actual.indexOf(code);
                              if (actualPos === i) {
                                status = "correct";
                              } else if (actualPos !== -1) {
                                const predictedAdvances = i <= 1;
                                const actualAdvances = actualPos <= 1;
                                status =
                                  predictedAdvances === actualAdvances
                                    ? "bucket"
                                    : "wrong";
                              } else {
                                status = "wrong";
                              }
                            }
                            return (
                              <div
                                key={code}
                                className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                                  status === "correct"
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : status === "bucket"
                                    ? "bg-yellow-500/10 border border-yellow-500/20"
                                    : status === "wrong"
                                    ? "bg-red-500/10 border border-red-500/20"
                                    : ""
                                }`}
                              >
                                <span className="text-xs font-bold text-gray-500 w-5">
                                  {i + 1}.
                                </span>
                                <span className="text-lg">
                                  {team?.flag ?? "🏳️"}
                                </span>
                                <span className="text-sm text-white flex-1">
                                  {team?.name ?? code}
                                </span>
                                {status === "correct" && (
                                  <span className="text-xs text-green-400 font-bold">
                                    +3
                                  </span>
                                )}
                                {status === "bucket" && (
                                  <span className="text-xs text-yellow-400 font-bold">
                                    +1
                                  </span>
                                )}
                                {status === "wrong" && (
                                  <span className="text-xs text-red-400">
                                    0
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No group predictions submitted yet.
                    </p>
                  </CardBody>
                </Card>
              )
            ) : (
              <Card>
                <CardBody className="text-center py-8">
                  <span className="text-3xl block mb-2">🔒</span>
                  <p className="text-gray-400">
                    Group predictions are hidden until the tournament starts on{" "}
                    {formatRevealDate(TOURNAMENT_START)}.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Tiebreaker */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                Tiebreaker: Final Score Prediction
              </h2>
            </CardHeader>
            <CardBody>
              <p className="font-heading text-2xl font-bold text-white text-center">
                {tiebreaker.homeScore} : {tiebreaker.awayScore}
              </p>
            </CardBody>
          </Card>
        </Container>
      </section>
    </>
  );
}

function BonusItem({
  label,
  tier,
  tierColor,
  value,
}: {
  label: string;
  tier: string;
  tierColor: "accent" | "gold";
  value: React.ReactNode;
}) {
  return (
    <div className="flex-1 sm:px-4 first:sm:pl-0 last:sm:pr-0">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            tierColor === "accent"
              ? "bg-accent/20 text-accent"
              : "bg-gold/20 text-gold"
          }`}
        >
          {tier}
        </span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function renderTeam(code: string): React.ReactNode {
  if (!code) return "Not set";
  const team = getTeamByCode(code);
  if (!team) return code;
  return (
    <span className="inline-flex items-center gap-1">
      <span>{team.flag}</span> {team.name}
    </span>
  );
}
