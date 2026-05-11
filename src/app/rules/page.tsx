import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import {
  tier1Categories,
  tier2Categories,
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
  knockoutRoundPoints,
  knockoutRoundMatchCounts,
} from "@/data/participants";

export const metadata: Metadata = {
  title: "Rules",
  description: "Official rules for the World Cup 2026 Fantasy contest, including the two-tier scoring system.",
};

function ScoringRow({ label, icon, points, description }: { label: string; icon: string; points: number; description: string }) {
  return (
    <div className="flex items-start gap-4 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white">{label}</p>
          <span className="text-sm font-bold text-gold whitespace-nowrap">{points} pts max</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function RulesPage() {
  const knockoutRounds = [
    { key: "round_of_32", label: "Round of 32" },
    { key: "round_of_16", label: "Round of 16" },
    { key: "quarter", label: "Quarterfinals" },
    { key: "semi", label: "Semifinals" },
    { key: "final", label: "Final" },
  ];

  return (
    <>
      <PageHeader
        title="Contest Rules"
        subtitle="Everything you need to know about the two-tier World Cup 2026 Fantasy scoring system."
        icon="📜"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Overview */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Overview
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                  <p>
                    The World Cup 2026 Fantasy uses a <strong className="text-white">two-tier scoring system</strong>.
                    Tier 1 covers group stage predictions, submitted before the tournament starts.
                    Tier 2 covers the knockout bracket, submitted after the group stage ends.
                  </p>
                  <p>
                    Both tiers include bonus picks for individual awards.
                    The participant with the most combined points across both tiers wins.
                    Maximum possible score: <strong className="text-gold">{OVERALL_MAX} points</strong>.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Important Dates */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Important Dates
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {[
                    { date: "June 1, 2026", event: "Tier 1 Picks Deadline", detail: "All group predictions and Tier 1 bonus picks must be submitted. No changes after this date.", highlight: true },
                    { date: "June 11, 2026", event: "Tournament Begins", detail: "Opening match kicks off the World Cup." },
                    { date: "June 27, 2026", event: "Group Stage Ends", detail: "Knockout bracket is finalized. Tier 2 predictions open." },
                    { date: "June 28, 2026", event: "Tier 2 Picks Deadline", detail: "Knockout bracket predictions must be submitted before the Round of 32 begins.", highlight: true },
                    { date: "July 19, 2026", event: "Final", detail: "All picks are resolved. Final standings determined." },
                  ].map((item) => (
                    <div key={item.event} className={`flex items-start gap-4 rounded-lg px-4 py-3 border ${
                      item.highlight ? "bg-accent/5 border-accent/20" : "bg-navy-lighter/30 border-white/5"
                    }`}>
                      <div className="flex-shrink-0 w-28">
                        <p className={`text-xs font-semibold ${item.highlight ? "text-accent" : "text-gray-400"}`}>
                          {item.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.event}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Tier 1 Scoring */}
            <Card className="border-accent/20">
              <CardHeader className="bg-accent/5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 font-heading font-bold text-accent">
                    1
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                      Tier 1: Group Stage Predictions
                    </h2>
                    <p className="text-xs text-gray-500">
                      Submitted before June 1, 2026 · Maximum {TIER1_MAX} points
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {/* Group Order Scoring */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">📊 Group Finishing Order (12 groups, 144 pts max)</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      For each of the 12 groups, predict the finishing order from 1st to 4th. That is 48 team placements total.
                    </p>
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-navy-lighter/50">
                            <th className="text-left px-4 py-2 text-xs font-semibold uppercase text-gray-500">Result</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold uppercase text-gray-500">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-white/5">
                            <td className="px-4 py-2.5 text-gray-300">Exact finishing position correct</td>
                            <td className="px-4 py-2.5 text-right font-bold text-accent">3 pts per team</td>
                          </tr>
                          <tr className="border-t border-white/5">
                            <td className="px-4 py-2.5 text-gray-300">Right bucket (advance/exit correct, wrong position)</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gold">1 pt per team</td>
                          </tr>
                          <tr className="border-t border-white/5">
                            <td className="px-4 py-2.5 text-gray-300">Wrong bucket</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">0 pts</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5">
                      <p className="text-xs text-gray-500">
                        <strong className="text-gray-400">Bucket definition:</strong> In the 2026 format,
                        the top 2 from each group advance automatically, plus 8 best 3rd-place teams.
                        For scoring, 1st and 2nd place = &quot;advances&quot; bucket.
                        3rd and 4th place = &quot;exits&quot; bucket.
                        If you predicted a team to finish 1st and they finish 2nd, you get 1 point
                        (right bucket, wrong position).
                      </p>
                    </div>
                  </div>

                  {/* Tier 1 Bonus Picks */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Tier 1 Bonus Picks (30 pts max)</h3>
                    <div className="space-y-3">
                      {tier1Categories.filter(c => c.id !== "group_positions").map((cat) => (
                        <ScoringRow
                          key={cat.id}
                          label={cat.label}
                          icon={cat.icon}
                          points={cat.maxPoints}
                          description={cat.description}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Note: Most Goals and Fewest Goals Conceded are measured during the <strong className="text-gray-400">group stage only</strong>, not the entire tournament.
                      Golden Boot is measured across the <strong className="text-gray-400">entire tournament</strong>.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Tier 2 Scoring */}
            <Card className="border-gold/20">
              <CardHeader className="bg-gold/5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 font-heading font-bold text-gold">
                    2
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                      Tier 2: Knockout Bracket
                    </h2>
                    <p className="text-xs text-gray-500">
                      Submitted after group stage ends · Maximum {TIER2_MAX} points
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {/* Bracket Scoring */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">🏆 Knockout Bracket (114 pts max)</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Once the knockout bracket is finalized, predict the winner of every match from the Round of 32 through the Final.
                    </p>
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-navy-lighter/50">
                            <th className="text-left px-4 py-2 text-xs font-semibold uppercase text-gray-500">Round</th>
                            <th className="text-center px-4 py-2 text-xs font-semibold uppercase text-gray-500">Matches</th>
                            <th className="text-center px-4 py-2 text-xs font-semibold uppercase text-gray-500">Points Each</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold uppercase text-gray-500">Max Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {knockoutRounds.map(({ key, label }) => (
                            <tr key={key} className="border-t border-white/5">
                              <td className="px-4 py-2.5 text-gray-300">{label}</td>
                              <td className="px-4 py-2.5 text-center text-gray-400">{knockoutRoundMatchCounts[key]}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-gold">{knockoutRoundPoints[key]} pts</td>
                              <td className="px-4 py-2.5 text-right text-gray-300">
                                {knockoutRoundMatchCounts[key] * knockoutRoundPoints[key]} pts
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-white/10 bg-navy-lighter/30">
                            <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-white">Total</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gold">114 pts</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tier 2 Bonus */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Tier 2 Bonus Pick (10 pts max)</h3>
                    <div className="space-y-3">
                      {tier2Categories.filter(c => c.id !== "knockout_bracket").map((cat) => (
                        <ScoringRow
                          key={cat.id}
                          label={cat.label}
                          icon={cat.icon}
                          points={cat.maxPoints}
                          description={cat.description}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Points Summary */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Points Summary
                </h2>
              </CardHeader>
              <CardBody>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy-lighter/50">
                        <th className="text-left px-4 py-2 text-xs font-semibold uppercase text-gray-500">Component</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase text-gray-500">Max Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-white/5">
                        <td className="px-4 py-2.5 text-gray-300">Tier 1: Group Finishing Order (12 groups x 4 teams)</td>
                        <td className="px-4 py-2.5 text-right text-accent font-bold">144 pts</td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="px-4 py-2.5 text-gray-300">Tier 1: Bonus Picks (Golden Boot, Most Goals, Fewest Conceded)</td>
                        <td className="px-4 py-2.5 text-right text-accent font-bold">30 pts</td>
                      </tr>
                      <tr className="border-t border-white/10 bg-accent/5">
                        <td className="px-4 py-2.5 text-white font-semibold">Tier 1 Subtotal</td>
                        <td className="px-4 py-2.5 text-right text-accent font-bold">{TIER1_MAX} pts</td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="px-4 py-2.5 text-gray-300">Tier 2: Knockout Bracket (31 matches)</td>
                        <td className="px-4 py-2.5 text-right text-gold font-bold">114 pts</td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="px-4 py-2.5 text-gray-300">Tier 2: Bonus Pick (Golden Ball)</td>
                        <td className="px-4 py-2.5 text-right text-gold font-bold">10 pts</td>
                      </tr>
                      <tr className="border-t border-white/10 bg-gold/5">
                        <td className="px-4 py-2.5 text-white font-semibold">Tier 2 Subtotal</td>
                        <td className="px-4 py-2.5 text-right text-gold font-bold">{TIER2_MAX} pts</td>
                      </tr>
                      <tr className="border-t border-white/10 bg-white/5">
                        <td className="px-4 py-3 text-white font-heading font-bold uppercase">Overall Maximum</td>
                        <td className="px-4 py-3 text-right font-heading text-lg font-bold text-white">{OVERALL_MAX} pts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            {/* Tiebreakers */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Tiebreakers
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                  <p>
                    If two or more participants finish with the same total points, ties are broken by:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>
                      <strong className="text-white">Final score prediction:</strong> Each participant predicts the final score of the championship match. The participant whose prediction is closest to the actual scoreline (by combined goal difference) wins the tiebreaker.
                    </li>
                    <li>
                      <strong className="text-white">More correct exact group positions:</strong> The participant with more group teams in the exact right position wins.
                    </li>
                    <li>
                      <strong className="text-white">Earlier submission timestamp:</strong> If still tied, the participant who submitted their Tier 1 picks first wins.
                    </li>
                  </ol>
                </div>
              </CardBody>
            </Card>

            {/* 48-Team Format Clarifications */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  2026 Format Clarifications
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-5 text-sm text-gray-300 leading-relaxed">
                  <div>
                    <h3 className="font-medium text-white mb-1">48 Teams, 12 Groups</h3>
                    <p>
                      The 2026 World Cup expands to 48 teams in 12 groups of 4.
                      The top 2 from each group advance automatically to the Round of 32.
                      The 8 best 3rd-place teams also advance.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">What Counts as &quot;Advances&quot;?</h3>
                    <p>
                      For group prediction scoring, &quot;advances&quot; = 1st or 2nd place.
                      &quot;Exits&quot; = 3rd or 4th place.
                      While some 3rd-place teams will advance in practice, for bucket scoring purposes
                      we treat 3rd as the &quot;exits&quot; bucket to keep scoring clean and predictable.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">Knockout Bracket Structure</h3>
                    <p>
                      32 teams enter the knockout stage. The bracket has 31 total matches:
                      16 in R32, 8 in R16, 4 quarterfinals, 2 semifinals, and 1 final.
                      Points per correct pick increase as the rounds progress.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">Extra Time and Penalties</h3>
                    <p>
                      In knockout matches, the team that advances (even via penalties) is the &quot;winner&quot;
                      for bracket prediction purposes. For the tiebreaker final score prediction,
                      only the score at the end of extra time counts (not penalty shootout).
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Buy-In */}
            <Card className="border-gold/20">
              <CardHeader className="bg-gold/5">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Entry Fee
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 text-sm text-gray-300">
                  <p>
                    A <strong className="text-gold">$10 buy-in</strong> is required to participate.
                    The pot goes to the winner.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-white">Payment options:</p>
                    <ul className="space-y-1 ml-4">
                      <li>📱 <strong className="text-white">Venmo:</strong> @Luke-Inglis</li>
                      <li>💳 <strong className="text-white">PayPal:</strong> Send to Luke</li>
                      <li>💵 <strong className="text-white">Cash or other:</strong> Arrange directly with Luke</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500">
                    Payment must be received before the tournament starts on June 11, 2026. You will confirm payment when submitting your picks.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* House Rules */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  House Rules
                </h2>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>$10 buy-in required. Pot goes to the winner.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>No changing picks after each tier&apos;s deadline. Period.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Tier 2 picks cannot be submitted until the full knockout bracket is announced.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>This is a friendly contest. Bragging rights are the primary prize.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Any disputes will be settled by the commissioner (Luke) with final authority.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Results are based on official FIFA outcomes. Own goals count for the team, not the player.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Trash talk is encouraged. Poor sportsmanship is not.</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
