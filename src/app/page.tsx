import Link from "next/link";
import Container from "@/components/Container";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardBody } from "@/components/Card";
import {
  participants,
  tier1Categories,
  tier2Categories,
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
  getGroupWinnerDistribution,
} from "@/data/participants";
import { getTeamByCode, groupLabels } from "@/data/teams";

function QuickStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="text-center">
      <span className="text-2xl block mb-1" aria-hidden>{icon}</span>
      <p className="font-heading text-2xl font-bold text-white sm:text-3xl">{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

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

export default function Home() {
  // Most popular group winners across all groups
  const popularPicks: { group: string; team: string; count: number }[] = [];
  for (const group of groupLabels) {
    const dist = getGroupWinnerDistribution(group);
    const top = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      popularPicks.push({ group, team: top[0], count: top[1] });
    }
  }

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
        <Container className="relative py-16 sm:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="animate-fade-in-up">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-accent sm:text-sm">
                USA · Mexico · Canada
              </p>
              <h1 className="mt-4 font-heading text-5xl font-extrabold uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
                World Cup{" "}
                <span className="text-gradient">2026</span>{" "}
                Fantasy
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-gray-300/90 sm:text-2xl mx-auto">
                Two tiers. Group predictions, knockout brackets, and bonus picks. Compete for bragging rights.
              </p>
            </div>

            {/* Countdown */}
            <div className="mt-10 animate-fade-in-up animate-delay-100">
              <CountdownTimer />
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in-up animate-delay-200">
              <Link
                href="/picks"
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
              <Link
                href="/rules"
                className="font-heading rounded-lg border border-white/20 px-6 py-3 text-base font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5"
              >
                Contest Rules
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick Stats */}
      <section className="border-b border-white/10 bg-navy-light/30 py-8">
        <Container>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
            <QuickStat label="Participants" value={String(participants.length)} icon="👥" />
            <QuickStat label="Teams" value="48" icon="🏟️" />
            <QuickStat label="Groups" value="12" icon="📊" />
            <QuickStat label="Host Cities" value="16" icon="🌎" />
            <QuickStat label="Max Points" value={String(OVERALL_MAX)} icon="🏆" />
          </div>
        </Container>
      </section>

      {/* Two-Tier System */}
      <section className="py-12 sm:py-16">
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
              deadline="June 1, 2026"
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

      {/* Popular Group Winners */}
      <section className="py-12 sm:py-16 border-t border-white/10 bg-navy-light/20">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Popular Group Winners
            </h2>
            <p className="mt-2 text-gray-400">
              Most popular 1st-place pick for each group
            </p>
          </div>
          {participants.length === 0 ? (
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
                        {count}/{participants.length} picks
                      </p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 border-t border-white/10">
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

      {/* Key Dates */}
      <section className="py-12 sm:py-16 border-t border-white/10 bg-navy-light/20">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Key Dates
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
            {[
              { date: "June 1, 2026", event: "Tier 1 Picks Lock", icon: "🔒", highlight: true },
              { date: "June 11, 2026", event: "Opening Match", icon: "🏟️", highlight: false },
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
