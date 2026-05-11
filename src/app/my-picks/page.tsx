"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";
import { getTeamsByGroup, teams, groupLabels } from "@/data/teams";

type GroupOrder = Record<string, [string, string, string, string]>;

interface FormData {
  groupPredictions: GroupOrder;
  goldenBoot: string;
  mostGoalsTeam: string;
  fewestConcededTeam: string;
  tiebreaker: { homeScore: number; awayScore: number };
  paymentConfirmed: boolean;
}

const STEPS = [
  { id: "groups", label: "Group Predictions", icon: "📊" },
  { id: "bonus", label: "Bonus Picks", icon: "🎯" },
  { id: "payment", label: "Payment", icon: "💰" },
  { id: "review", label: "Review & Submit", icon: "✅" },
];

function getInitialGroupPredictions(): GroupOrder {
  const teamsByGroup = getTeamsByGroup();
  const predictions: GroupOrder = {};
  for (const group of groupLabels) {
    const groupTeams = teamsByGroup[group] ?? [];
    predictions[group] = [
      groupTeams[0]?.code ?? "",
      groupTeams[1]?.code ?? "",
      groupTeams[2]?.code ?? "",
      groupTeams[3]?.code ?? "",
    ] as [string, string, string, string];
  }
  return predictions;
}

function GroupOrderPicker({
  group,
  order,
  onOrderChange,
}: {
  group: string;
  order: [string, string, string, string];
  onOrderChange: (newOrder: [string, string, string, string]) => void;
}) {
  const teamsByGroup = getTeamsByGroup();
  const groupTeams = teamsByGroup[group] ?? [];

  function moveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...order] as [string, string, string, string];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onOrderChange(newOrder);
  }

  function moveDown(index: number) {
    if (index >= 3) return;
    const newOrder = [...order] as [string, string, string, string];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onOrderChange(newOrder);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-navy-light/80 overflow-hidden">
      <div className="border-b border-white/10 px-4 py-2.5">
        <h4 className="font-heading text-sm font-bold uppercase tracking-wide text-white">
          Group {group}
        </h4>
      </div>
      <div className="divide-y divide-white/5">
        {order.map((code, i) => {
          const team = groupTeams.find((t) => t.code === code);
          const isAdvancing = i <= 1;
          return (
            <div
              key={code}
              className={`flex items-center gap-2 px-3 py-2 ${
                isAdvancing ? "bg-pitch/5" : ""
              }`}
            >
              <span className={`w-5 text-center text-xs font-bold ${
                isAdvancing ? "text-accent" : "text-gray-600"
              }`}>
                {i + 1}
              </span>
              <span className="text-lg">{team?.flag ?? ""}</span>
              <span className="text-sm text-white flex-1 truncate">
                {team?.name ?? code}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-accent hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Move ${team?.name ?? code} up`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,8 6,4 10,8" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i >= 3}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-accent hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Move ${team?.name ?? code} down`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,4 6,8 10,4" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-1.5 bg-navy-lighter/30 border-t border-white/5">
        <p className="text-[10px] text-gray-600">
          Green = predicted to advance
        </p>
      </div>
    </div>
  );
}

function StepGroups({
  predictions,
  onUpdate,
}: {
  predictions: GroupOrder;
  onUpdate: (predictions: GroupOrder) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2">
          Predict Group Finishing Order
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          For each group, arrange the teams in your predicted finishing order (1st through 4th).
          Use the arrows to reorder. Top 2 (green) = predicted to advance.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groupLabels.map((group) => (
          <GroupOrderPicker
            key={group}
            group={group}
            order={predictions[group]}
            onOrderChange={(newOrder) => {
              onUpdate({ ...predictions, [group]: newOrder });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StepBonus({
  goldenBoot,
  mostGoalsTeam,
  fewestConcededTeam,
  tiebreaker,
  onUpdate,
}: {
  goldenBoot: string;
  mostGoalsTeam: string;
  fewestConcededTeam: string;
  tiebreaker: { homeScore: number; awayScore: number };
  onUpdate: (field: string, value: string | number | { homeScore: number; awayScore: number }) => void;
}) {
  const teamOptions = teams.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2">
          Bonus Picks
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Each bonus pick is worth 10 points if correct.
        </p>
      </div>

      <Card className="border-accent/10">
        <CardBody>
          <div className="space-y-5">
            {/* Golden Boot */}
            <div>
              <label htmlFor="goldenBoot" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                <span>👟</span> Golden Boot (Tournament Top Scorer)
              </label>
              <input
                id="goldenBoot"
                type="text"
                value={goldenBoot}
                onChange={(e) => onUpdate("goldenBoot", e.target.value)}
                placeholder="Player name (e.g. Kylian Mbappe)"
                className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              />
            </div>

            {/* Most Goals Team */}
            <div>
              <label htmlFor="mostGoalsTeam" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                <span>⚽</span> Most Goals (Team, Group Stage Only)
              </label>
              <select
                id="mostGoalsTeam"
                value={mostGoalsTeam}
                onChange={(e) => onUpdate("mostGoalsTeam", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              >
                <option value="">Select a team</option>
                {teamOptions.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fewest Conceded Team */}
            <div>
              <label htmlFor="fewestConcededTeam" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                <span>🛡️</span> Fewest Goals Conceded (Team, Group Stage Only)
              </label>
              <select
                id="fewestConcededTeam"
                value={fewestConcededTeam}
                onChange={(e) => onUpdate("fewestConcededTeam", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              >
                <option value="">Select a team</option>
                {teamOptions.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tiebreaker */}
      <Card>
        <CardBody>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <span>🏟️</span> Tiebreaker: Predicted Final Score
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Predict the score of the championship match (after extra time if applicable, not penalties).
              This is used only to break ties.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="homeScore" className="block text-xs text-gray-600 mb-1">
                  Home
                </label>
                <input
                  id="homeScore"
                  type="number"
                  min={0}
                  max={20}
                  value={tiebreaker.homeScore}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onUpdate("tiebreaker", {
                      homeScore: isNaN(val) ? 0 : Math.max(0, val),
                      awayScore: tiebreaker.awayScore,
                    });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white text-center text-lg font-heading font-bold focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <span className="text-gray-600 font-bold text-lg pt-5">:</span>
              <div className="flex-1">
                <label htmlFor="awayScore" className="block text-xs text-gray-600 mb-1">
                  Away
                </label>
                <input
                  id="awayScore"
                  type="number"
                  min={0}
                  max={20}
                  value={tiebreaker.awayScore}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onUpdate("tiebreaker", {
                      homeScore: tiebreaker.homeScore,
                      awayScore: isNaN(val) ? 0 : Math.max(0, val),
                    });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white text-center text-lg font-heading font-bold focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function StepPayment({
  confirmed,
  onConfirm,
}: {
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2">
          Payment Confirmation
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          A $10 buy-in is required to participate. The pot goes to the winner.
        </p>
      </div>

      <Card className="border-gold/20">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💰</span>
              <div>
                <p className="font-heading text-2xl font-bold text-gold">$10</p>
                <p className="text-xs text-gray-500">Entry fee</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Payment Options:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-navy-lighter/50 px-4 py-3 border border-white/5">
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="text-sm text-white font-medium">Venmo</p>
                    <p className="text-xs text-gray-500">@Luke-Inglis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-navy-lighter/50 px-4 py-3 border border-white/5">
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="text-sm text-white font-medium">PayPal</p>
                    <p className="text-xs text-gray-500">Send to Luke</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-navy-lighter/50 px-4 py-3 border border-white/5">
                  <span className="text-lg">💵</span>
                  <div>
                    <p className="text-sm text-white font-medium">Cash or Other</p>
                    <p className="text-xs text-gray-500">Arrange directly with Luke</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => onConfirm(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-navy-lighter text-accent focus:ring-accent focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">
                  I confirm I have paid or will pay the $10 entry fee before the tournament starts on June 11, 2026.
                </span>
              </label>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function StepReview({
  formData,
}: {
  formData: FormData;
}) {
  const teamsByGroup = getTeamsByGroup();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2">
          Review Your Picks
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Review everything below before submitting. Once submitted, picks are locked.
        </p>
      </div>

      {/* Group Predictions Summary */}
      <Card>
        <CardHeader>
          <h4 className="font-heading text-base font-bold uppercase tracking-wide text-white">
            Group Predictions
          </h4>
        </CardHeader>
        <CardBody className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 divide-white/5">
            {groupLabels.map((group) => {
              const order = formData.groupPredictions[group];
              const groupTeams = teamsByGroup[group] ?? [];
              return (
                <div key={group} className="px-4 py-3 sm:border-r sm:border-b border-white/5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Group {group}
                  </p>
                  <div className="space-y-0.5">
                    {order.map((code, i) => {
                      const team = groupTeams.find((t) => t.code === code);
                      return (
                        <div key={code} className="flex items-center gap-1.5 text-xs">
                          <span className={`w-3 text-center font-bold ${i <= 1 ? "text-accent" : "text-gray-600"}`}>
                            {i + 1}
                          </span>
                          <span>{team?.flag ?? ""}</span>
                          <span className="text-gray-300">{team?.name ?? code}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Bonus Picks Summary */}
      <Card className="border-accent/10">
        <CardHeader>
          <h4 className="font-heading text-base font-bold uppercase tracking-wide text-white">
            Bonus Picks
          </h4>
        </CardHeader>
        <CardBody>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">👟 Golden Boot</span>
              <span className="text-white font-medium">{formData.goldenBoot || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">⚽ Most Goals (Team)</span>
              <span className="text-white font-medium">
                {formData.mostGoalsTeam
                  ? (() => { const t = teams.find(t => t.code === formData.mostGoalsTeam); return t ? `${t.flag} ${t.name}` : formData.mostGoalsTeam; })()
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">🛡️ Fewest Conceded (Team)</span>
              <span className="text-white font-medium">
                {formData.fewestConcededTeam
                  ? (() => { const t = teams.find(t => t.code === formData.fewestConcededTeam); return t ? `${t.flag} ${t.name}` : formData.fewestConcededTeam; })()
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-gray-400">🏟️ Tiebreaker (Final Score)</span>
              <span className="text-white font-medium">
                {formData.tiebreaker.homeScore} : {formData.tiebreaker.awayScore}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Payment Status */}
      <Card className={formData.paymentConfirmed ? "border-accent/20" : "border-red-500/20"}>
        <CardBody>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{formData.paymentConfirmed ? "✅" : "⚠️"}</span>
            <div>
              <p className={`text-sm font-medium ${formData.paymentConfirmed ? "text-accent" : "text-red-400"}`}>
                {formData.paymentConfirmed ? "Payment confirmed" : "Payment not confirmed"}
              </p>
              <p className="text-xs text-gray-500">
                {formData.paymentConfirmed
                  ? "$10 buy-in confirmed or pending"
                  : "Go back to confirm payment"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function MyPicksPage() {
  const router = useRouter();
  const { user, loading, passcode } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [existingPicks, setExistingPicks] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<FormData>({
    groupPredictions: getInitialGroupPredictions(),
    goldenBoot: "",
    mostGoalsTeam: "",
    fewestConcededTeam: "",
    tiebreaker: { homeScore: 1, awayScore: 0 },
    paymentConfirmed: false,
  });

  // Check for existing picks
  const checkExistingPicks = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/picks?userId=${user.id}`);
      const data = await res.json();
      if (data.picks) {
        setExistingPicks(true);
        setSubmitted(true);
        // Load existing picks into form
        setFormData({
          groupPredictions: data.picks.groupPredictions.reduce(
            (acc: GroupOrder, gp: { group: string; order: [string, string, string, string] }) => {
              acc[gp.group] = gp.order;
              return acc;
            },
            {} as GroupOrder
          ),
          goldenBoot: data.picks.goldenBoot ?? "",
          mostGoalsTeam: data.picks.mostGoalsTeam ?? "",
          fewestConcededTeam: data.picks.fewestConcededTeam ?? "",
          tiebreaker: data.picks.tiebreaker ?? { homeScore: 1, awayScore: 0 },
          paymentConfirmed: true,
        });
      } else {
        setExistingPicks(false);
      }
    } catch {
      setExistingPicks(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingPicks();
    }
  }, [user, checkExistingPicks]);

  // Redirect if not logged in
  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  if (loading) {
    return (
      <section className="py-20">
        <Container>
          <div className="text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        </Container>
      </section>
    );
  }

  async function handleSubmit() {
    if (!user || !passcode) {
      setError("Please log in again to submit your picks.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.name,
          passcode,
          picks: {
            groupPredictions: groupLabels.map((group) => ({
              group,
              order: formData.groupPredictions[group],
            })),
            goldenBoot: formData.goldenBoot,
            mostGoalsTeam: formData.mostGoalsTeam,
            fewestConcededTeam: formData.fewestConcededTeam,
            goldenBall: "",
            tiebreaker: formData.tiebreaker,
            tier2Submitted: false,
            knockoutPicks: [],
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit picks");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <PageHeader
          title="My Picks"
          subtitle="Your predictions for the World Cup 2026."
          icon="📋"
        />
        <section className="py-10 sm:py-14">
          <Container>
            <div className="max-w-2xl mx-auto text-center">
              <Card className="border-accent/20">
                <CardBody className="py-12">
                  <span className="text-5xl block mb-4" aria-hidden>🎉</span>
                  <h2 className="font-heading text-2xl font-bold text-white mb-2">
                    Picks Submitted!
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Your Tier 1 predictions are locked in. Good luck!
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Tier 2 (Knockout Bracket) will be available after the group stage ends on June 27, 2026.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setSubmitted(false); setStep(0); }}
                      className="font-heading rounded-lg border border-white/20 px-6 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5"
                    >
                      View My Picks
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/picks")}
                      className="font-heading rounded-lg bg-pitch px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40"
                    >
                      See All Picks
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Container>
        </section>
      </>
    );
  }

  const canProceed =
    step === 0
      ? true // Groups are always filled with defaults
      : step === 1
      ? formData.goldenBoot.trim() !== "" &&
        formData.mostGoalsTeam !== "" &&
        formData.fewestConcededTeam !== ""
      : step === 2
      ? formData.paymentConfirmed
      : true;

  return (
    <>
      <PageHeader
        title="My Picks"
        subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].label}`}
        icon={STEPS[step].icon}
      />

      <section className="py-10 sm:py-14">
        <Container>
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    i === step
                      ? "bg-pitch text-white shadow-lg shadow-pitch/20"
                      : i < step
                      ? "text-accent hover:bg-white/5 cursor-pointer"
                      : "text-gray-600 cursor-not-allowed"
                  }`}
                  disabled={i > step}
                >
                  <span aria-hidden>{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {step === 0 && (
            <StepGroups
              predictions={formData.groupPredictions}
              onUpdate={(predictions) => setFormData({ ...formData, groupPredictions: predictions })}
            />
          )}

          {step === 1 && (
            <StepBonus
              goldenBoot={formData.goldenBoot}
              mostGoalsTeam={formData.mostGoalsTeam}
              fewestConcededTeam={formData.fewestConcededTeam}
              tiebreaker={formData.tiebreaker}
              onUpdate={(field, value) => {
                if (field === "tiebreaker") {
                  setFormData({ ...formData, tiebreaker: value as { homeScore: number; awayScore: number } });
                } else {
                  setFormData({ ...formData, [field]: value });
                }
              }}
            />
          )}

          {step === 2 && (
            <StepPayment
              confirmed={formData.paymentConfirmed}
              onConfirm={(v) => setFormData({ ...formData, paymentConfirmed: v })}
            />
          )}

          {step === 3 && <StepReview formData={formData} />}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 max-w-2xl mx-auto">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="font-heading rounded-lg border border-white/20 px-6 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
                className="font-heading rounded-lg bg-pitch px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !formData.paymentConfirmed}
                className="font-heading rounded-lg bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wide text-navy shadow-lg shadow-accent/20 transition-all hover:bg-green-300 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : existingPicks ? "Update Picks" : "Submit Picks"}
              </button>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
