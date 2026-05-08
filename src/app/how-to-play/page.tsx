import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import {
  tier1Categories,
  tier2Categories,
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
} from "@/data/participants";

export const metadata: Metadata = {
  title: "How to Play",
  description: "Learn how the two-tier World Cup 2026 Fantasy contest works.",
};

export default function HowToPlayPage() {
  return (
    <>
      <PageHeader
        title="How to Play"
        subtitle="Your guide to the two-tier World Cup 2026 Fantasy contest."
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
                  title: "Study the Groups",
                  desc: "Check out the 48 teams across 12 groups. Look at FIFA rankings, confederations, and recent form. You will need to predict the finishing order for every group.",
                  icon: "📚",
                  link: { href: "/groups", label: "View Groups" },
                },
                {
                  step: 3,
                  title: "Submit Tier 1 Picks (Before June 1)",
                  desc: "Predict the 1st through 4th finishing order for all 12 groups. Also pick your Golden Boot (top scorer), Most Goals Team (group stage), and Fewest Goals Conceded Team (group stage). Lock it in before the deadline.",
                  icon: "📊",
                },
                {
                  step: 4,
                  title: "Watch the Group Stage",
                  desc: "Follow the group stage action and see how your predictions hold up. Tier 1 points are awarded as group results are finalized.",
                  icon: "📺",
                },
                {
                  step: 5,
                  title: "Submit Tier 2 Picks (After Groups End)",
                  desc: "Once the knockout bracket is set, predict the winner of every match from the Round of 32 through the Final. Also pick your Golden Ball (best player). Submit before the R32 kicks off.",
                  icon: "🏆",
                },
                {
                  step: 6,
                  title: "Watch the Knockouts",
                  desc: "Follow the knockout rounds. Tier 2 points increase as rounds progress, so getting later-round picks right is worth more.",
                  icon: "⚔️",
                },
                {
                  step: 7,
                  title: "Claim Victory",
                  desc: "After the final on July 19th, total points from both tiers determine the winner. If tied, the predicted final score breaks it.",
                  icon: "👑",
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
                            {item.link.label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Tier 1 Quick Reference */}
            <Card className="border-accent/20">
              <CardHeader className="bg-accent/5">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Tier 1 Quick Reference ({TIER1_MAX} pts max)
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {tier1Categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5"
                    >
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{cat.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.scoring}</p>
                      </div>
                      <span className="text-sm font-bold text-accent whitespace-nowrap">{cat.maxPoints} pts</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Tier 2 Quick Reference */}
            <Card className="border-gold/20">
              <CardHeader className="bg-gold/5">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Tier 2 Quick Reference ({TIER2_MAX} pts max)
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {tier2Categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5"
                    >
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{cat.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.scoring}</p>
                      </div>
                      <span className="text-sm font-bold text-gold whitespace-nowrap">{cat.maxPoints} pts</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400">
                    Overall maximum: <span className="font-bold text-white">{OVERALL_MAX} points</span>
                    {" "}(Tier 1: {TIER1_MAX} + Tier 2: {TIER2_MAX})
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Strategy Tips */}
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
                      <strong className="text-white">Group order is king in Tier 1.</strong> With 144 points available from group positions alone (vs 30 from bonuses), getting finishing orders right is the biggest lever. Exact positions are worth 3x more than bucket matches.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">2.</span>
                    <p>
                      <strong className="text-white">Do not just pick favorites first.</strong> Getting the 3rd and 4th place teams right matters too. Each exact position is 3 points regardless of whether it is 1st or 4th.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">3.</span>
                    <p>
                      <strong className="text-white">Later knockout rounds are worth more.</strong> Getting the Final right is 10 pts, while a Round of 32 pick is only 2 pts. Focus your research on predicting deep runs correctly.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">4.</span>
                    <p>
                      <strong className="text-white">Most Goals and Fewest Conceded are group stage only.</strong> Think about which teams play attacking football vs defensive football in the groups specifically. A defensive team that advances may concede more in knockouts, but that does not affect this pick.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">5.</span>
                    <p>
                      <strong className="text-white">Tier 2 is a second chance.</strong> Even if your Tier 1 picks were rough, Tier 2 offers up to {TIER2_MAX} points. You can make up significant ground in the knockout bracket.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5">6.</span>
                    <p>
                      <strong className="text-white">Tiebreaker is the final score.</strong> Predict the exact final score of the championship match. Think about whether it will be a cagey or open affair. This only matters if you tie on points with someone else.
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
