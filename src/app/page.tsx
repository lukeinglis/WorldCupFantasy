import Link from "next/link";
import Container from "@/components/Container";
import CountdownTimer from "@/components/CountdownTimer";
import MiniGames from "@/components/games/MiniGames";
import { Card, CardBody } from "@/components/Card";
import {
  tier1Categories,
  tier2Categories,
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
} from "@/data/participants";
import {
  calculateAllPoints,
  setActualGroupResults,
  setActualBonusResults,
  setActualKnockoutResults,
  setKnockoutMatchSchedule,
} from "@/data/scoring";
import { getTeamByCode, groupLabels } from "@/data/teams";
import { getMatches, getScorers, isApiConfigured } from "@/lib/football-api";
import { getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import {
  getLiveGroupResults,
  getLiveBonusResults,
  getLiveKnockoutResults,
} from "@/lib/live-scoring";
import { TOURNAMENT_START } from "@/lib/tournament-dates";
import type { TransformedMatch, TransformedScorer } from "@/lib/football-api-types";

export const dynamic = "force-dynamic";

function TierCard({
  tier,
  title,
  maxPoints,
  categories,
  color,
  deadline,
}: {
  tier: number;
  title: string;
  maxPoints: number;
  categories: { icon: string; label: string; maxPoints: number; scoring: string }[];
  color: "accent" | "gold";
  deadline: string;
}) {
  const borderColor = color === "accent" ? "border-accent/30" : "border-gold/30";
  const bgColor = color === "accent" ? "bg-accent/5" : "bg-gold/5";
  const textColor = color === "accent" ? "text-accent" : "text-gold";
  const badgeBg = color === "accent" ? "bg-accent/20" : "bg-gold/20";

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardBody className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${badgeBg} font-heading font-bold text-lg ${textColor}`}>
            {tier}
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-gray-500">Deadline: {deadline}</p>
          </div>
          <span className={`ml-auto font-heading text-xl font-bold ${textColor}`}>
            {maxPoints} pts
          </span>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3 rounded-lg bg-navy-lighter/50 px-4 py-2.5 border border-white/5">
              <span className="text-lg" aria-hidden>{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{cat.label}</p>
                <p className="text-xs text-gray-500 truncate">{cat.scoring}</p>
              </div>
              <span className={`text-sm font-bold ${textColor} whitespace-nowrap`}>{cat.maxPoints} pts</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

export default async function Home() {
  const apiReady = isApiConfigured();
  const kvReady = isKvConfigured();

  const [matches, scorers, kvData] = await Promise.all([
    apiReady ? getMatches() : Promise.resolve(null),
    apiReady ? getScorers() : Promise.resolve(null),
    kvReady ? getAllUsersWithPicks() : Promise.resolve([]),
  ]);

  const kvParticipants = kvData.length > 0 ? buildParticipantsFromKv(kvData) : [];

  // Inject live scoring for leaderboard preview
  if (apiReady) {
    const [groupResults, bonusResults, knockoutResults] = await Promise.all([
      getLiveGroupResults(),
      getLiveBonusResults(),
      getLiveKnockoutResults(),
    ]);
    if (groupResults) setActualGroupResults(groupResults.groups);
    if (bonusResults) setActualBonusResults(bonusResults);
    if (knockoutResults) setActualKnockoutResults(knockoutResults.results);
    if (matches) {
      const knockoutStages = ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];
      const knockoutSchedule = matches
        .filter(m => knockoutStages.includes(m.stage))
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
        .reduce<{ round: string; matchNumber: number; utcDate: string; homeTeam: string; awayTeam: string; status: string }[]>((acc, m) => {
          const matchNumber = acc.filter(x => x.round === m.stage).length + 1;
          acc.push({
            round: m.stage,
            matchNumber,
            utcDate: m.utcDate,
            homeTeam: m.homeTeam.tla,
            awayTeam: m.awayTeam.tla,
            status: m.status,
          });
          return acc;
        }, []);
      setKnockoutMatchSchedule(knockoutSchedule);
    }
  }

  const withPoints = calculateAllPoints(kvParticipants);
  const sorted = [...withPoints].sort((a, b) => {
    const totalDiff = b.calculatedPoints.total - a.calculatedPoints.total;
    if (totalDiff !== 0) return totalDiff;
    const tier1Diff =
      b.calculatedPoints.tier1Groups + b.calculatedPoints.tier1Bonus -
      (a.calculatedPoints.tier1Groups + a.calculatedPoints.tier1Bonus);
    if (tier1Diff !== 0) return tier1Diff;
    return a.name.localeCompare(b.name);
  });
  const ranked = sorted.map((p, i) => ({
    ...p,
    rank: i + 1,
    total: p.calculatedPoints.total,
  }));
  // ranked already contains all participants sorted by points

  // Popular group winner picks
  const popularPicks: { group: string; team: string; count: number }[] = [];
  for (const group of groupLabels) {
    const dist: Record<string, number> = {};
    for (const p of kvParticipants) {
      const gp = p.groupPredictions.find((g) => g.group === group);
      if (gp && gp.order[0]) {
        dist[gp.order[0]] = (dist[gp.order[0]] ?? 0) + 1;
      }
    }
    const top = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      popularPicks.push({ group, team: top[0], count: top[1] });
    }
  }

  let recentResults: TransformedMatch[] = [];
  let liveMatches: TransformedMatch[] = [];
  let topScorers: TransformedScorer[] = [];
  let matchesPlayed = 0;
  let totalMatches = 0;

  let upcomingMatches: TransformedMatch[] = [];

  if (matches) {
    totalMatches = matches.length;
    matchesPlayed = matches.filter((m) => m.status === "FINISHED").length;
    liveMatches = matches.filter((m) => m.isLive);
    recentResults = matches
      .filter((m) => m.status === "FINISHED")
      .sort(
        (a, b) =>
          new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
      )
      .slice(0, 4);
    upcomingMatches = matches
      .filter((m) => m.status !== "FINISHED" && !m.isLive)
      .sort(
        (a, b) =>
          new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
      )
      .slice(0, 4);
  }

  if (scorers) {
    topScorers = scorers.slice(0, 5);
  }

  const hasTournamentData = matchesPlayed > 0 || liveMatches.length > 0;
  const isTournamentActive = hasTournamentData || new Date() >= TOURNAMENT_START;
  const isGroupStageOver = matchesPlayed >= 48 || new Date() >= new Date('2026-06-27T00:00:00-04:00');

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-pitch-dark via-navy to-navy-light">
        <div className="field-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 dot-pattern opacity-[0.03]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(0, 230, 118, 0.08), transparent 70%)",
          }}
        />
        <Container className="relative py-10 sm:py-14 lg:py-16">
          <div className="flex flex-col items-center text-center">
            <div className="animate-fade-in-up">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-accent sm:text-sm">
                USA · Mexico · Canada
              </p>
              <h1 className="mt-4 font-heading text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
                World Cup{" "}
                <span className="text-gradient">2026</span>{" "}
                Fantasy
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-gray-300/90 sm:text-2xl mx-auto">
                Two tiers. Group predictions, knockout brackets, and bonus picks. Compete for bragging rights.
              </p>
            </div>

            {/* Countdown */}
            <div className="mt-6 animate-fade-in-up animate-delay-100">
              <CountdownTimer />
            </div>

            {/* Phase-aware CTA buttons */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 animate-fade-in-up animate-delay-200">
              {isTournamentActive ? (
                <>
                  <Link
                    href="/leaderboard"
                    className="font-heading rounded-lg bg-accent px-8 py-3 text-base font-bold uppercase tracking-wide text-navy shadow-lg shadow-accent/20 transition-all hover:bg-green-300 hover:shadow-accent/40"
                  >
                    Leaderboard
                  </Link>
                  {isGroupStageOver ? (
                    <Link
                      href="/my-picks"
                      className="font-heading rounded-lg bg-gold px-6 py-3 text-base font-bold uppercase tracking-wide text-navy shadow-lg shadow-gold/20 transition-all hover:bg-yellow-300 hover:shadow-gold/40"
                    >
                      Submit Tier 2 Picks
                    </Link>
                  ) : (
                    <Link
                      href="/groups?tab=picks"
                      className="font-heading rounded-lg bg-pitch px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40"
                    >
                      View Picks
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/join"
                    className="font-heading rounded-lg bg-accent px-8 py-3 text-base font-bold uppercase tracking-wide text-navy shadow-lg shadow-accent/20 transition-all hover:bg-green-300 hover:shadow-accent/40"
                  >
                    Join the Contest
                  </Link>
                  <Link
                    href="/groups?tab=picks"
                    className="font-heading rounded-lg bg-pitch px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40"
                  >
                    View Picks
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="font-heading rounded-lg border border-accent/40 px-6 py-3 text-base font-bold uppercase tracking-wide text-accent transition-all hover:bg-accent/10"
                  >
                    Leaderboard
                  </Link>
                </>
              )}
              <Link
                href="/rules"
                className="font-heading rounded-lg border border-white/20 px-6 py-3 text-base font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5"
              >
                Rules
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Leaderboard Preview */}
      {ranked.length > 0 && (
        <section className="py-8 border-b border-white/10 bg-navy-light/20">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white">
                Leaderboard
              </h2>
              <Link
                href="/leaderboard"
                className="text-sm text-accent hover:text-green-300 transition-colors"
              >
                Full Standings →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {ranked.map((p) => (
                <Card key={p.id} hover className="text-center snap-start min-w-[140px] flex-shrink-0">
                  <CardBody className="py-4">
                    <div className="mb-1">
                      {p.rank <= 3 ? (
                        <span className="text-2xl">{getMedalEmoji(p.rank)}</span>
                      ) : (
                        <span className="font-heading text-lg font-bold text-gray-500">{p.rank}</span>
                      )}
                    </div>
                    <p className="font-heading text-sm font-bold text-white truncate">
                      {p.name}
                    </p>
                    <p className="font-heading text-2xl font-bold text-accent mt-1">
                      {p.total}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Live Matches (if any) */}
      {liveMatches.length > 0 && (
        <section className="py-8 border-b border-white/10 bg-red-500/5">
          <Container>
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                LIVE NOW
              </span>
              <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                Matches in Progress
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {liveMatches.map((match) => (
                <Card key={match.id} className="border-red-500/20 bg-red-500/5">
                  <CardBody>
                    <div className="flex items-center gap-2 mb-2">
                      {match.group && (
                        <span className="text-xs text-gray-500">
                          Group {match.group}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        {match.homeTeam.crest && (
                          <img
                            src={match.homeTeam.crest}
                            alt={match.homeTeam.shortName}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span className="font-heading font-bold text-white">
                          {match.homeTeam.shortName}
                        </span>
                      </div>
                      <span className="font-heading text-2xl font-bold text-red-400 px-3">
                        {match.score.fullTime.home ?? 0} : {match.score.fullTime.away ?? 0}
                      </span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-heading font-bold text-white">
                          {match.awayTeam.shortName}
                        </span>
                        {match.awayTeam.crest && (
                          <img
                            src={match.awayTeam.crest}
                            alt={match.awayTeam.shortName}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Results & Upcoming */}
      {(recentResults.length > 0 || upcomingMatches.length > 0) && (
        <section className="py-10 border-b border-white/10">
          <Container>
            <div className={`grid grid-cols-1 gap-6 ${recentResults.length > 0 && upcomingMatches.length > 0 ? "lg:grid-cols-2" : ""}`}>
              {recentResults.length > 0 && (
                <div>
                  <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-accent mb-4">
                    Recent Results
                  </h2>
                  <div className="space-y-2">
                    {recentResults.map((match) => (
                      <div key={match.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-navy-lighter/30 px-3 py-2.5">
                        <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                          {match.group ? `Grp ${match.group}` : match.stage}{" "}
                          {new Date(match.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          <span className="text-sm text-white truncate">{match.homeTeam.shortName}</span>
                          {match.homeTeam.crest && (
                            <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain" />
                          )}
                        </div>
                        <span className="font-heading text-sm font-bold text-white px-2 min-w-[40px] text-center">
                          {match.score.fullTime.home ?? 0}:{match.score.fullTime.away ?? 0}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1">
                          {match.awayTeam.crest && (
                            <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain" />
                          )}
                          <span className="text-sm text-white truncate">{match.awayTeam.shortName}</span>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-gray-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 flex-shrink-0">
                          FT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {upcomingMatches.length > 0 && (
                <div>
                  <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-gold mb-4">
                    Upcoming
                  </h2>
                  <div className="space-y-2">
                    {upcomingMatches.map((match) => (
                      <div key={match.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-navy-lighter/30 px-3 py-2.5">
                        <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                          {match.group ? `Grp ${match.group}` : match.stage}{" "}
                          {new Date(match.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          <span className="text-sm text-white truncate">{match.homeTeam.shortName}</span>
                          {match.homeTeam.crest && (
                            <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain" />
                          )}
                        </div>
                        <span className="font-heading text-sm font-bold text-gray-400 px-2 min-w-[40px] text-center">
                          vs
                        </span>
                        <div className="flex items-center gap-1.5 flex-1">
                          {match.awayTeam.crest && (
                            <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain" />
                          )}
                          <span className="text-sm text-white truncate">{match.awayTeam.shortName}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">
                          {new Date(match.utcDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/groups?tab=schedule"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Full Schedule →
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Top Scorers (if tournament has started) */}
      {topScorers.length > 0 && (
        <section className="py-10 border-b border-white/10 bg-navy-light/20">
          <Container>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-6">
              Top Scorers
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {topScorers.map((scorer, i) => (
                <Card key={`${scorer.playerName}-${i}`} hover className="text-center">
                  <CardBody className="py-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {scorer.teamCrest && (
                        <img
                          src={scorer.teamCrest}
                          alt={scorer.teamTla}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="text-xs text-gray-500">{scorer.teamTla}</span>
                    </div>
                    <p className="font-heading text-sm font-bold text-white">
                      {scorer.playerName}
                    </p>
                    <p className="font-heading text-2xl font-bold text-accent mt-1">
                      {scorer.goals}
                    </p>
                    <p className="text-xs text-gray-500">
                      {scorer.goals === 1 ? "goal" : "goals"}
                      {scorer.assists > 0 &&
                        `, ${scorer.assists} ${scorer.assists === 1 ? "assist" : "assists"}`}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Two-Tier System */}
      <section className="py-12 sm:py-16 border-t border-white/10">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Two-Tier Scoring System
            </h2>
            <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
              Tier 1 covers group stage predictions (submitted before the tournament).
              Tier 2 covers the knockout bracket (submitted after groups finish).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TierCard
              tier={1}
              title="Group Stage Predictions"
              maxPoints={TIER1_MAX}
              categories={tier1Categories}
              color="accent"
              deadline="June 11, 2026"
            />
            <TierCard
              tier={2}
              title="Knockout Bracket"
              maxPoints={TIER2_MAX}
              categories={tier2Categories}
              color="gold"
              deadline="After group stage ends"
            />
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Overall maximum: <span className="font-bold text-white">{OVERALL_MAX} points</span>
              {" "}(Tier 1: {TIER1_MAX} + Tier 2: {TIER2_MAX})
            </p>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 border-t border-white/10 bg-navy-light/20">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Predict Groups", desc: "Before the tournament, predict the finishing order for all 12 groups plus bonus picks.", icon: "📊" },
              { step: "2", title: "Watch Groups", desc: "Follow the group stage and see how your predictions hold up in real time.", icon: "📺" },
              { step: "3", title: "Fill Your Bracket", desc: "Once the knockout bracket is set, predict winners for every match from R32 to the Final.", icon: "🏆" },
              { step: "4", title: "Claim Victory", desc: "Total points from both tiers determine the champion. Tiebreaker: predicted final score.", icon: "👑" },
            ].map((item) => (
              <Card key={item.step} hover>
                <CardBody className="text-center py-8">
                  <span className="text-3xl mb-3 block" aria-hidden>{item.icon}</span>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pitch/20 text-accent font-heading font-bold text-sm mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Mini Games */}
      <MiniGames />

      {/* Popular Group Winners (bottom) */}
      <section className="py-12 sm:py-16 border-t border-white/10">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Popular Group Winners
            </h2>
            <p className="mt-2 text-gray-400">
              Most popular 1st-place pick for each group
            </p>
          </div>
          {kvParticipants.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3" aria-hidden>📋</span>
              <p className="text-gray-400 text-sm">No participants yet. Popular picks will appear here once contestants submit their predictions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 max-w-5xl mx-auto">
              {popularPicks.map(({ group, team, count }) => {
                const teamData = getTeamByCode(team);
                if (!teamData) return null;
                return (
                  <Card key={group} hover className="text-center">
                    <CardBody className="py-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Group {group}
                      </p>
                      <span className="text-3xl block mb-1">{teamData.flag}</span>
                      <p className="font-heading text-sm font-bold text-white">{teamData.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {count}/{kvParticipants.length} picks
                      </p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* Key Dates (bottom) */}
      <section className="py-12 sm:py-16 border-t border-white/10 bg-navy-light/20">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Key Dates
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
            {[
              { date: "June 11, 2026", event: "Tier 1 Picks Lock (Kickoff)", icon: "🔒", highlight: true },
              { date: "June 27, 2026", event: "Groups End", icon: "📊", highlight: false },
              { date: "June 28, 2026", event: "Tier 2 Picks Lock", icon: "🔒", highlight: true },
              { date: "July 19, 2026", event: "Final", icon: "🏆", highlight: true },
            ].map((item) => (
              <div
                key={item.event}
                className={`rounded-lg px-5 py-4 border text-center ${
                  item.highlight
                    ? "border-accent/30 bg-accent/5"
                    : "border-white/10 bg-navy-lighter/30"
                }`}
              >
                <span className="text-2xl block mb-2" aria-hidden>{item.icon}</span>
                <p className={`font-heading text-sm font-bold uppercase tracking-wide ${item.highlight ? "text-accent" : "text-white"}`}>
                  {item.event}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.date}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
