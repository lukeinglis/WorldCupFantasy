"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";
import { getTeamsByGroup, teams, groupLabels } from "@/data/teams";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** null means the team hasn't been ranked yet */
type GroupRanking = Record<string, (string | null)[]>;

interface FormData {
  groupRankings: GroupRanking;
  goldenBoot: string;
  mostGoalsTeam: string;
  fewestConcededTeam: string;
  tiebreakerGoals: string;
  paymentConfirmed: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getEmptyGroupRankings(): GroupRanking {
  const rankings: GroupRanking = {};
  for (const group of groupLabels) {
    rankings[group] = [null, null, null, null];
  }
  return rankings;
}

function isGroupComplete(ranking: (string | null)[]): boolean {
  return ranking.every((r) => r !== null);
}

function completedGroupCount(rankings: GroupRanking): number {
  return groupLabels.filter((g) => isGroupComplete(rankings[g])).length;
}

/* ------------------------------------------------------------------ */
/*  Confetti (lightweight CSS-only burst)                              */
/* ------------------------------------------------------------------ */

function ConfettiBurst() {
  const colors = ["#00E676", "#FFD700", "#FF6B6B", "#4FC3F7", "#BA68C8", "#FF8A65"];
  // Pre-compute random values so render is pure
  const pieces = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const color = colors[i % colors.length];
      // Deterministic distribution based on index with some variation
      const left = ((i * 37 + 13) % 100);
      const delay = (i % 10) * 0.05;
      const duration = 1.5 + (i % 7) * 0.25;
      const rotate = (i * 47 % 720) - 360;
      const size = 6 + (i % 5);
      return { color, left, delay, duration, rotate, size };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tap-to-Rank Group Card                                             */
/* ------------------------------------------------------------------ */

function TapToRankGroup({
  group,
  ranking,
  onRankingChange,
}: {
  group: string;
  ranking: (string | null)[];
  onRankingChange: (newRanking: (string | null)[]) => void;
}) {
  const teamsByGroup = getTeamsByGroup();
  const groupTeams = teamsByGroup[group] ?? [];
  const complete = isGroupComplete(ranking);
  const nextRank = ranking.filter((r) => r !== null).length; // 0-indexed next slot

  function handleTapTeam(teamCode: string) {
    const currentIndex = ranking.indexOf(teamCode);

    if (currentIndex !== -1) {
      // Team is already ranked. Remove it and shift others down.
      const newRanking = [...ranking];
      newRanking[currentIndex] = null;
      // Compact: move non-null values to front
      const ranked = newRanking.filter((r) => r !== null);
      const compacted = [...ranked, ...Array(4 - ranked.length).fill(null)];
      onRankingChange(compacted);
    } else if (nextRank < 4) {
      // Assign next rank
      const newRanking = [...ranking];
      newRanking[nextRank] = teamCode;
      onRankingChange(newRanking);
    }
  }

  function handleReset() {
    onRankingChange([null, null, null, null]);
  }

  // Get rank position for a team (null if unranked)
  function getRank(teamCode: string): number | null {
    const idx = ranking.indexOf(teamCode);
    return idx === -1 ? null : idx;
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        complete
          ? "border-accent/30 bg-navy-light/80 shadow-md shadow-accent/5"
          : "border-white/10 bg-navy-light/60"
      }`}
    >
      <div className="border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
        <h4 className="font-heading text-sm font-bold uppercase tracking-wide text-white">
          Group {group}
        </h4>
        <div className="flex items-center gap-2">
          {complete && (
            <span className="text-xs text-accent font-medium">Done</span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-1"
            aria-label={`Reset Group ${group}`}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {groupTeams.map((team) => {
          const rank = getRank(team.code);
          const isRanked = rank !== null;
          const isAdvancing = isRanked && rank <= 1;
          const isEliminated = isRanked && rank >= 2;

          return (
            <button
              key={team.code}
              type="button"
              onClick={() => handleTapTeam(team.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 active:scale-[0.98] ${
                isAdvancing
                  ? "bg-pitch/20 border border-accent/30 shadow-sm"
                  : isEliminated
                  ? "bg-white/[0.02] border border-white/5"
                  : "bg-navy-lighter/40 border border-transparent hover:bg-white/5 hover:border-white/10"
              }`}
            >
              {/* Rank badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-200 ${
                  isAdvancing
                    ? "bg-accent text-navy"
                    : isEliminated
                    ? "bg-white/10 text-gray-400"
                    : "bg-navy-lighter/60 text-gray-600 border border-dashed border-gray-700"
                }`}
              >
                {isRanked ? rank + 1 : ""}
              </div>

              {/* Team info */}
              <span className="text-lg leading-none">{team.flag}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium truncate block ${
                  isRanked ? "text-white" : "text-gray-400"
                }`}>
                  {team.name}
                </span>
                <span className="text-[10px] text-gray-600">
                  FIFA #{team.fifaRanking}
                </span>
              </div>

              {/* Visual hint */}
              {!isRanked && nextRank < 4 && (
                <span className="text-[10px] text-gray-700">
                  tap for {nextRank + 1}{nextRank === 0 ? "st" : nextRank === 1 ? "nd" : nextRank === 2 ? "rd" : "th"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Team Dropdown (grouped by group)                                   */
/* ------------------------------------------------------------------ */

function TeamDropdown({
  id,
  value,
  onChange,
  label,
  icon,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  icon: string;
}) {
  const teamsByGroup = getTeamsByGroup();

  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
        <span>{icon}</span> {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
      >
        <option value="">Select a team</option>
        {groupLabels.map((group) => {
          const groupTeams = teamsByGroup[group] ?? [];
          return (
            <optgroup key={group} label={`Group ${group}`}>
              {groupTeams.sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function MyPicksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [existingPicks, setExistingPicks] = useState(false);
  const submitRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    groupRankings: getEmptyGroupRankings(),
    goldenBoot: "",
    mostGoalsTeam: "",
    fewestConcededTeam: "",
    tiebreakerGoals: "",
    paymentConfirmed: false,
  });

  // Load existing picks
  const loadExistingPicks = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/picks?userId=${userId}`);
      const data = await res.json();
      if (data.picks) {
        // Convert stored group predictions to ranking format
        const rankings = getEmptyGroupRankings();
        for (const gp of data.picks.groupPredictions) {
          rankings[gp.group] = gp.order;
        }
        const tb = data.picks.tiebreaker ?? { homeScore: 0, awayScore: 0 };
        const totalGoals = (tb.homeScore ?? 0) + (tb.awayScore ?? 0);
        return {
          found: true,
          formData: {
            groupRankings: rankings,
            goldenBoot: data.picks.goldenBoot ?? "",
            mostGoalsTeam: data.picks.mostGoalsTeam ?? "",
            fewestConcededTeam: data.picks.fewestConcededTeam ?? "",
            tiebreakerGoals: totalGoals > 0 ? String(totalGoals) : "",
            paymentConfirmed: true,
          } as FormData,
        };
      }
    } catch {
      // No existing picks, start fresh
    }
    return { found: false, formData: null };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadExistingPicks(user.id).then((result) => {
      if (cancelled) return;
      if (result.found && result.formData) {
        setExistingPicks(true);
        setSubmitted(true);
        setFormData(result.formData);
      }
    });
    return () => { cancelled = true; };
  }, [user, loadExistingPicks]);

  // Redirect if not logged in
  if (!loading && !user) {
    router.push("/join");
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

  // Form validation
  const groupsCompleted = completedGroupCount(formData.groupRankings);
  const allGroupsDone = groupsCompleted === 12;
  const bonusComplete =
    formData.goldenBoot.trim() !== "" &&
    formData.mostGoalsTeam !== "" &&
    formData.fewestConcededTeam !== "" &&
    formData.tiebreakerGoals.trim() !== "";
  const paymentDone = formData.paymentConfirmed;
  const canSubmit = allGroupsDone && bonusComplete && paymentDone;

  // Build list of what's missing
  const missing: string[] = [];
  if (!allGroupsDone) missing.push(`Complete ${12 - groupsCompleted} more group${12 - groupsCompleted !== 1 ? "s" : ""}`);
  if (!formData.goldenBoot.trim()) missing.push("Pick your Golden Boot winner");
  if (!formData.mostGoalsTeam) missing.push("Pick Most Goals team");
  if (!formData.fewestConcededTeam) missing.push("Pick Fewest Goals Conceded team");
  if (!formData.tiebreakerGoals.trim()) missing.push("Enter your tiebreaker prediction");
  if (!paymentDone) missing.push("Confirm payment");

  async function handleSubmit() {
    if (!user || !canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      // Convert tiebreakerGoals (total goals) to home/away format
      // We split evenly, with remainder going to home
      const totalGoals = parseInt(formData.tiebreakerGoals, 10);
      const safeTotal = isNaN(totalGoals) || totalGoals < 0 ? 0 : totalGoals;
      const homeScore = Math.ceil(safeTotal / 2);
      const awayScore = safeTotal - homeScore;

      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          picks: {
            groupPredictions: groupLabels.map((group) => ({
              group,
              order: formData.groupRankings[group] as [string, string, string, string],
            })),
            goldenBoot: formData.goldenBoot.trim(),
            mostGoalsTeam: formData.mostGoalsTeam,
            fewestConcededTeam: formData.fewestConcededTeam,
            goldenBall: "",
            tiebreaker: { homeScore, awayScore },
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
      setEditing(false);
      setExistingPicks(true);
      setSubmitting(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // Show submitted state
  if (submitted && !editing) {
    const teamsByGroup = getTeamsByGroup();
    return (
      <>
        {showConfetti && <ConfettiBurst />}
        <PageHeader
          title="My Picks"
          subtitle="Your predictions for the World Cup 2026."
          icon="📋"
        />
        <section className="py-10 sm:py-14">
          <Container>
            <div className="max-w-4xl mx-auto">
              {/* Success banner */}
              <Card className="border-accent/20 mb-8">
                <CardBody className="py-8 text-center">
                  <span className="text-5xl block mb-3" aria-hidden>🎉</span>
                  <h2 className="font-heading text-2xl font-bold text-white mb-2">
                    Picks Submitted!
                  </h2>
                  <p className="text-gray-400 mb-4">
                    Good luck! You can update your picks until June 11, 2026.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="font-heading rounded-lg bg-pitch px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40"
                  >
                    Edit Picks
                  </button>
                </CardBody>
              </Card>

              {/* Current picks summary */}
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white mb-4">
                Your Group Predictions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {groupLabels.map((group) => {
                  const order = formData.groupRankings[group];
                  const groupTeams = teamsByGroup[group] ?? [];
                  return (
                    <div key={group} className="rounded-lg border border-white/10 bg-navy-light/60 p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Group {group}
                      </p>
                      <div className="space-y-1">
                        {order.map((code, i) => {
                          if (!code) return null;
                          const team = groupTeams.find((t) => t.code === code);
                          return (
                            <div key={code} className="flex items-center gap-1.5 text-xs">
                              <span className={`w-4 text-center font-bold ${i <= 1 ? "text-accent" : "text-gray-600"}`}>
                                {i + 1}
                              </span>
                              <span>{team?.flag ?? ""}</span>
                              <span className="text-gray-300 truncate">{team?.name ?? code}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bonus picks summary */}
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white mb-4">
                Bonus Picks
              </h3>
              <Card className="border-accent/10">
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Golden Boot</span>
                      <span className="text-white font-medium">{formData.goldenBoot || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Most Goals (Team)</span>
                      <span className="text-white font-medium">
                        {formData.mostGoalsTeam
                          ? (() => { const t = teams.find(t => t.code === formData.mostGoalsTeam); return t ? `${t.flag} ${t.name}` : formData.mostGoalsTeam; })()
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fewest Goals Conceded (Team)</span>
                      <span className="text-white font-medium">
                        {formData.fewestConcededTeam
                          ? (() => { const t = teams.find(t => t.code === formData.fewestConcededTeam); return t ? `${t.flag} ${t.name}` : formData.fewestConcededTeam; })()
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-gray-400">Tiebreaker: Total Goals in Final</span>
                      <span className="text-white font-medium">{formData.tiebreakerGoals || "Not set"}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Container>
        </section>
      </>
    );
  }

  // The form
  return (
    <>
      <PageHeader
        title="Make Your Picks"
        subtitle="Picks lock on June 11, 2026. Have fun with it!"
        icon="📋"
      />

      <section className="py-8 sm:py-10">
        <Container>
          <div className="max-w-5xl mx-auto">
            {/* Progress bar */}
            <div className="mb-8 sticky top-[65px] z-30 bg-navy/95 backdrop-blur py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  <span className="text-accent font-bold">{groupsCompleted}</span> of 12 groups completed
                </span>
                <span className="text-xs text-gray-600">
                  {canSubmit ? "Ready to submit!" : `${missing.length} ${missing.length === 1 ? "thing" : "things"} remaining`}
                </span>
              </div>
              <div className="w-full bg-navy-lighter rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round(
                      ((groupsCompleted / 12) * 60 +
                        (formData.goldenBoot.trim() ? 10 : 0) +
                        (formData.mostGoalsTeam ? 10 : 0) +
                        (formData.fewestConcededTeam ? 10 : 0) +
                        (formData.tiebreakerGoals.trim() ? 5 : 0) +
                        (formData.paymentConfirmed ? 5 : 0))
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* SECTION 1: Groups */}
            <div className="mb-12">
              <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2">
                Group Predictions
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Tap teams in the order you think they will finish. 1st tap = predicted winner.
                Tap a ranked team to unrank it.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupLabels.map((group) => (
                  <TapToRankGroup
                    key={group}
                    group={group}
                    ranking={formData.groupRankings[group]}
                    onRankingChange={(newRanking) => {
                      setFormData((prev) => ({
                        ...prev,
                        groupRankings: { ...prev.groupRankings, [group]: newRanking },
                      }));
                    }}
                  />
                ))}
              </div>
            </div>

            {/* SECTION 2: Bonus Picks */}
            <div className="mb-12">
              <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2">
                Bonus Picks
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Each bonus pick is worth 10 points if correct.
              </p>

              <div className="max-w-2xl space-y-5">
                {/* Golden Boot */}
                <div>
                  <label htmlFor="goldenBoot" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                    <span>👟</span> Golden Boot (Tournament Top Scorer)
                  </label>
                  <input
                    id="goldenBoot"
                    type="text"
                    value={formData.goldenBoot}
                    onChange={(e) => setFormData({ ...formData, goldenBoot: e.target.value })}
                    placeholder="e.g. Kylian Mbappe"
                    className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                  />
                </div>

                {/* Most Goals Team */}
                <TeamDropdown
                  id="mostGoalsTeam"
                  value={formData.mostGoalsTeam}
                  onChange={(v) => setFormData({ ...formData, mostGoalsTeam: v })}
                  label="Most Goals in Group Stage (Team)"
                  icon="⚽"
                />

                {/* Fewest Conceded Team */}
                <TeamDropdown
                  id="fewestConcededTeam"
                  value={formData.fewestConcededTeam}
                  onChange={(v) => setFormData({ ...formData, fewestConcededTeam: v })}
                  label="Fewest Goals Conceded in Group Stage (Team)"
                  icon="🛡️"
                />

                {/* Tiebreaker */}
                <div>
                  <label htmlFor="tiebreaker" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                    <span>🏟️</span> Tiebreaker: Total Goals in the Final
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Predict the combined total goals scored in the championship match (after extra time, not penalties). Used only to break ties.
                  </p>
                  <input
                    id="tiebreaker"
                    type="number"
                    min={0}
                    max={20}
                    value={formData.tiebreakerGoals}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setFormData({ ...formData, tiebreakerGoals: "" });
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val) && isFinite(val) && val >= 0) {
                        setFormData({ ...formData, tiebreakerGoals: String(Math.min(val, 20)) });
                      }
                    }}
                    placeholder="e.g. 3"
                    className="w-32 rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white text-center text-lg font-heading font-bold focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Payment + Submit */}
            <div ref={submitRef} className="max-w-2xl">
              <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
                Entry Fee + Submit
              </h2>

              <Card className="border-gold/20 mb-6">
                <CardBody>
                  <p className="text-sm text-gray-300 mb-4">
                    <span className="font-semibold text-gold">$10 entry fee.</span>{" "}
                    Pay via Venmo (@Luke-Inglis), PayPal, or arrange with Luke.
                    The pot goes to the winner!
                  </p>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.paymentConfirmed}
                      onChange={(e) => setFormData({ ...formData, paymentConfirmed: e.target.checked })}
                      className="mt-1 h-5 w-5 rounded border-white/20 bg-navy-lighter text-accent focus:ring-accent focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">
                      I have paid or will pay the $10 entry fee before the tournament starts.
                    </span>
                  </label>
                </CardBody>
              </Card>

              {/* What's missing */}
              {missing.length > 0 && (
                <div className="rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Still needed:</p>
                  <ul className="space-y-0.5">
                    {missing.map((item) => (
                      <li key={item} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="text-gray-700">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`w-full font-heading rounded-xl px-8 py-4 text-lg font-bold uppercase tracking-wide shadow-lg transition-all ${
                  canSubmit
                    ? "bg-accent text-navy shadow-accent/20 hover:bg-green-300 hover:shadow-accent/40 active:scale-[0.98]"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                } disabled:opacity-70`}
              >
                {submitting
                  ? "Submitting..."
                  : existingPicks
                  ? "Update My Picks"
                  : "Submit My Picks ⚽"}
              </button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
