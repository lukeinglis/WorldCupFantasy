import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { categories } from "@/data/participants";

export const metadata: Metadata = {
  title: "Rules",
  description: "Official rules for the World Cup 2026 Fantasy contest.",
};

export default function RulesPage() {
  return (
    <>
      <PageHeader
        title="Contest Rules"
        subtitle="Everything you need to know about how the World Cup 2026 Fantasy contest works."
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
                    The World Cup 2026 Fantasy is a prediction contest among friends. Before the tournament starts,
                    each participant makes picks across eight categories. As the World Cup plays out, points are
                    awarded for correct predictions. The participant with the most points at the end wins.
                  </p>
                  <p>
                    It is simple, fun, and does not require managing a roster during the tournament. Just make
                    your picks, sit back, and enjoy the beautiful game.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Deadlines */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Important Dates
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {[
                    { date: "June 1, 2026", event: "Picks Deadline", detail: "All picks must be submitted before this date. No changes allowed after." },
                    { date: "June 11, 2026", event: "Tournament Begins", detail: "Opening match kicks off the World Cup." },
                    { date: "June 27, 2026", event: "Group Stage Ends", detail: "Group stage exit picks are resolved." },
                    { date: "July 19, 2026", event: "Final", detail: "All remaining picks are resolved. Final standings determined." },
                  ].map((item) => (
                    <div key={item.event} className="flex items-start gap-4 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5">
                      <div className="flex-shrink-0 w-24">
                        <p className="text-xs font-semibold text-accent">{item.date}</p>
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

            {/* Scoring */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Scoring
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-400 mb-4">
                  There are eight prediction categories, each worth a set number of points.
                  The maximum possible score is 125 points.
                </p>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-start gap-4 rounded-lg bg-navy-lighter/30 px-4 py-3 border border-white/5"
                    >
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{cat.label}</p>
                          <span className="text-sm font-bold text-gold whitespace-nowrap">{cat.points} pts</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Category Details */}
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Category Clarifications
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-5 text-sm text-gray-300 leading-relaxed">
                  <div>
                    <h3 className="font-medium text-white mb-1">🏆 World Cup Champion (25 pts)</h3>
                    <p>Pick the team that wins the final. If the match goes to penalties, the winner of the shootout is the champion.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">🥈 Runner Up (15 pts)</h3>
                    <p>Pick the team that loses in the final. You cannot pick the same team for both Champion and Runner Up.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">👟 Golden Boot (20 pts)</h3>
                    <p>Pick the player who scores the most goals in the tournament. If tied, FIFA uses assists, then fewest minutes played as tiebreakers. Pick any individual player by name.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">⚽ Golden Ball (15 pts)</h3>
                    <p>Pick the player named Best Player of the tournament by FIFA. This is a subjective award voted on after the tournament.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">🐴 Dark Horse (20 pts)</h3>
                    <p>Pick a team ranked outside the top 10 in the pre-tournament FIFA rankings that reaches the quarterfinals. If your pick does not qualify, you get 0 points for this category.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">🚪 Group Stage Exit (10 pts)</h3>
                    <p>Pick a team that fails to advance past the group stage. With 48 teams and 12 groups, the top 2 from each group plus 8 best third-placed teams advance.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">🟨 Most Disciplined (10 pts)</h3>
                    <p>Pick the team that receives the fewest cards (yellow + red) during the entire tournament. Yellow = 1 point, Red = 3 points. Lowest total wins.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">🥇 First Goal (10 pts)</h3>
                    <p>Pick the team that scores the very first goal of the tournament, in the opening match.</p>
                  </div>
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
                      <strong className="text-white">Tiebreaker prediction:</strong> Each participant predicts the total number of goals scored in the final match. The participant closest to the actual total (without going over) wins the tiebreaker.
                    </li>
                    <li>
                      <strong className="text-white">Number of correct categories:</strong> The participant with more correct picks wins.
                    </li>
                    <li>
                      <strong className="text-white">Highest value correct pick:</strong> The participant who correctly predicted the highest-point category wins.
                    </li>
                  </ol>
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
                    <span>No changing picks after the deadline. Period.</span>
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
