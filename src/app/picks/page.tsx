import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { participants, categories } from "@/data/participants";
import { getTeamByCode } from "@/data/teams";

export const metadata: Metadata = {
  title: "Picks",
  description: "See everyone's World Cup 2026 Fantasy picks across all categories.",
};

function getSelectionDisplay(category: string, selection: string): { label: string; flag?: string } {
  // For team-based categories, show flag + name
  const teamCategories = ["champion", "runner_up", "dark_horse", "group_stage_exit", "most_cards", "first_goal"];
  if (teamCategories.includes(category)) {
    const team = getTeamByCode(selection);
    if (team) {
      return { label: team.name, flag: team.flag };
    }
  }
  // Player name categories
  return { label: selection };
}

export default function PicksPage() {
  return (
    <>
      <PageHeader
        title="Everyone's Picks"
        subtitle="All predictions across every category. Who do you agree with?"
        icon="📋"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {/* By Category View */}
          <div className="space-y-8">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                        {cat.label}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cat.description} · {cat.points} points
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {participants.map((p) => {
                      const pick = p.picks.find(pk => pk.category === cat.id);
                      if (!pick) return null;
                      const display = getSelectionDisplay(cat.id, pick.selection);

                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 px-5 py-3 border-b border-r border-white/5 last:border-b-0"
                        >
                          <span className="text-lg">{p.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">{p.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {display.flag && (
                                <span className="text-base">{display.flag}</span>
                              )}
                              <p className="text-sm font-medium text-white truncate">
                                {display.label}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* By Person View */}
          <div className="mt-14">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white mb-6">
              Picks by Participant
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {participants.map((p) => (
                <Card key={p.id} hover>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <h3 className="font-heading text-base font-bold text-white">{p.name}</h3>
                        <p className="text-xs text-gray-500">
                          Tiebreaker: {p.tiebreaker} goals in final
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <table className="w-full">
                      <tbody>
                        {p.picks.map((pick) => {
                          const cat = categories.find(c => c.id === pick.category);
                          const display = getSelectionDisplay(pick.category, pick.selection);
                          if (!cat) return null;

                          return (
                            <tr key={pick.category} className="border-b border-white/5 last:border-b-0">
                              <td className="px-5 py-2.5 w-8">
                                <span className="text-base">{cat.icon}</span>
                              </td>
                              <td className="py-2.5">
                                <p className="text-xs text-gray-500">{cat.label}</p>
                              </td>
                              <td className="px-5 py-2.5 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {display.flag && (
                                    <span className="text-sm">{display.flag}</span>
                                  )}
                                  <span className="text-sm font-medium text-white">
                                    {display.label}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
