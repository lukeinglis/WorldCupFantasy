import Link from "next/link";
import Container from "@/components/Container";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardBody } from "@/components/Card";
import { participants, categories } from "@/data/participants";
import { getTeamByCode } from "@/data/teams";

function QuickStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="text-center">
      <span className="text-2xl block mb-1" aria-hidden>{icon}</span>
      <p className="font-heading text-2xl font-bold text-white sm:text-3xl">{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function CategoryPreview({ icon, label, points }: { icon: string; label: string; points: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-navy-lighter/50 px-4 py-3 border border-white/5">
      <span className="text-xl" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{label}</p>
      </div>
      <span className="text-sm font-bold text-gold">{points} pts</span>
    </div>
  );
}

export default function Home() {
  // Champion pick distribution
  const championPicks: Record<string, number> = {};
  for (const p of participants) {
    const champ = p.picks.find(pk => pk.category === "champion");
    if (champ) {
      championPicks[champ.selection] = (championPicks[champ.selection] ?? 0) + 1;
    }
  }
  const topPicks = Object.entries(championPicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

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
                Pick your champions, predict the stars, and compete for bragging rights with friends.
              </p>
            </div>

            {/* Countdown */}
            <div className="mt-10 animate-fade-in-up animate-delay-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                Kickoff Countdown
              </p>
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
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <QuickStat label="Participants" value={String(participants.length)} icon="👥" />
            <QuickStat label="Teams" value="48" icon="🏟️" />
            <QuickStat label="Host Cities" value="16" icon="🌎" />
            <QuickStat label="Max Points" value="125" icon="🏆" />
          </div>
        </Container>
      </section>

      {/* Categories Preview */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Pick Categories
            </h2>
            <p className="mt-2 text-gray-400">
              Eight categories, 125 possible points. Every pick counts.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <CategoryPreview
                key={cat.id}
                icon={cat.icon}
                label={cat.label}
                points={cat.points}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Popular Champion Picks */}
      <section className="py-12 sm:py-16 border-t border-white/10 bg-navy-light/20">
        <Container>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Champion Favorites
            </h2>
            <p className="mt-2 text-gray-400">
              Most popular champion picks across all participants
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto">
            {topPicks.map(([code, count], i) => {
              const team = getTeamByCode(code);
              if (!team) return null;
              return (
                <Card key={code} hover className="text-center">
                  <CardBody>
                    <span className="text-4xl block mb-2">{team.flag}</span>
                    <p className="font-heading text-lg font-bold text-white">{team.name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {count} {count === 1 ? "pick" : "picks"}
                    </p>
                    {i === 0 && (
                      <span className="inline-block mt-2 text-xs font-semibold text-gold bg-gold/10 rounded-full px-2.5 py-0.5">
                        Most Popular
                      </span>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Make Your Picks", desc: "Choose your predictions across 8 categories before the tournament begins.", icon: "📝" },
              { step: "2", title: "Watch the Matches", desc: "Follow the World Cup action as your picks play out in real time.", icon: "📺" },
              { step: "3", title: "Climb the Leaderboard", desc: "Earn points for correct predictions and see who comes out on top.", icon: "📊" },
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              { date: "June 1, 2026", event: "Picks Lock", icon: "🔒", highlight: true },
              { date: "June 11, 2026", event: "Opening Match", icon: "🏟️", highlight: false },
              { date: "June 28, 2026", event: "Knockout Stage", icon: "⚔️", highlight: false },
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
