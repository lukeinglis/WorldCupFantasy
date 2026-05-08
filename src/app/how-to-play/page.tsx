import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { categories } from "@/data/participants";

export const metadata: Metadata = {
  title: "How to Play",
  description: "Learn how to participate in the World Cup 2026 Fantasy contest.",
};

export default function HowToPlayPage() {
  return (
    <>
      <PageHeader
        title="How to Play"
        subtitle="Your guide to joining and winning the World Cup 2026 Fantasy contest."
        icon="📖"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Step by Step */}
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Get Invited",
                  desc: "The contest is invite-only among friends. If you are reading this, you are probably already in. Welcome!",
                  icon: "🎟️",
                },
                {
                  step: 2,
                  title: "Study the Field",
                  desc: "Check out the 48 teams in the Groups section. Look at FIFA rankings, confederations, and recent form. Knowledge is power.",
                  icon: "📚",
                  link: { href: "/groups", label: "View Groups →" },
                },
                {
                  step: 3,
                  title: "Make Your Picks",
                  desc: "Submit your predictions across all 8 categories before the June 1st deadline. Choose wisely; you cannot change them once locked.",
                  icon: "📝",
                },
                {
                  step: 4,
                  title: "Watch and Celebrate",
                  desc: "Sit back and watch the World Cup unfold across the USA, Mexico, and Canada. Points are awarded automatically as results come in.",
                  icon: "📺",
                },
                {
                  step: 5,
                  title: "Claim Victory",
                  desc: "After the final on July 19th, the participant with the most points wins. Bragging rights last until the next tournament.",
                  icon: "🏆",
                },
              ].map((item) => (
                <Card key={item.step} hover>
                  <CardBody>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-pitch/20 border border-accent/20 flex items-center justify-center">
                          <span className="font-heading text-lg font-bold text-accent">
                            {item.step}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden>{item.icon}</span>
                          <h3 className="font-heading text-lg font-bold text-white">
                            {item.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                          {item.desc}
                        </p>
                        {item.link && (
                          <Link
                            href={item.link.href}
                            className="inline-block mt-2 text-sm text-accent hover:text-green-300 transition-colors"
                          >
                            {item.link.label}
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Categories Quick Reference */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Categories Quick Reference
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5"
                    >
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{cat.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                      </div>
                      <span className="text-sm font-bold text-gold whitespace-nowrap">{cat.points} pts</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400">
                    Total possible: <span className="font-bold text-gold">125 points</span>
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Strategy Tips
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">1.</span>
                    <p>
                      <strong className="text-white">Maximize expected value.</strong> The Champion pick is worth 25 points, so getting it right matters most. But the Golden Boot (20 pts) and Dark Horse (20 pts) are nearly as valuable. Do not sleep on them.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">2.</span>
                    <p>
                      <strong className="text-white">Dark Horse is high risk, high reward.</strong> Pick a team outside the top 10 that you genuinely believe can make a quarterfinal run. Think Morocco in 2022 or Croatia in 2018.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">3.</span>
                    <p>
                      <strong className="text-white">Group Stage Exit is free points.</strong> With 48 teams, many strong-looking squads will go home early. Pick a team you think is overrated or stuck in a tough group.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">4.</span>
                    <p>
                      <strong className="text-white">Consider the host advantage.</strong> The USA, Mexico, and Canada will have home crowds. Historically, host nations perform above their ranking.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">5.</span>
                    <p>
                      <strong className="text-white">Tiebreaker matters.</strong> If multiple people pick the same champion, the tiebreaker (predicted goals in the final) can make or break your finish. Think carefully.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* CTA */}
            <div className="text-center pt-4">
              <p className="text-gray-400 mb-4">
                Ready to see what everyone picked?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/picks"
                  className="font-heading rounded-lg bg-pitch px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40"
                >
                  View All Picks
                </Link>
                <Link
                  href="/rules"
                  className="font-heading rounded-lg border border-white/20 px-6 py-3 text-base font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5"
                >
                  Full Rules
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
