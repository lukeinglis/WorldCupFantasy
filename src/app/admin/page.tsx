"use client";

import { useState, useEffect, useCallback } from "react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/auth";
import { getTeamByCode } from "@/data/teams";

interface AdminParticipant {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  hasTier1: boolean;
  hasTier2: boolean;
  submittedAt: string | null;
  groupCount: number;
  knockoutCount: number;
  picks: {
    groupPredictions: { group: string; order: [string, string, string, string] }[];
    goldenBoot: string;
    mostGoalsTeam: string;
    fewestConcededTeam: string;
    goldenBall: string;
    tiebreaker: { homeScore: number; awayScore: number };
    knockoutPicks: { round: string; matchNumber: number; winner: string }[];
  } | null;
}

interface AdminData {
  participants: AdminParticipant[];
  summary: {
    total: number;
    tier1Submitted: number;
    tier2Submitted: number;
  };
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span className="text-3xl" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className={`font-heading text-2xl font-bold ${accent}`}>{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function ExpandedPicks({ picks }: { picks: AdminParticipant["picks"] }) {
  if (!picks) return null;

  const teamName = (code: string) => {
    if (!code) return "Not set";
    const team = getTeamByCode(code);
    return team ? `${team.flag} ${team.name}` : code;
  };

  return (
    <div className="border-t border-white/10 bg-navy/50 px-4 py-4 sm:px-6">
      {/* Group predictions */}
      {picks.groupPredictions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Group Predictions ({picks.groupPredictions.length} groups)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {picks.groupPredictions.map((gp) => (
              <div
                key={gp.group}
                className="rounded bg-navy-lighter/50 px-2 py-1.5 border border-white/5"
              >
                <p className="text-[10px] text-gray-600 mb-1 font-semibold">
                  Group {gp.group}
                </p>
                {gp.order.map((code, i) => {
                  const team = getTeamByCode(code);
                  return (
                    <p
                      key={`${gp.group}-${i}`}
                      className={`text-[11px] ${i < 2 ? "text-accent" : "text-gray-500"}`}
                    >
                      {i + 1}. {team?.flag ?? ""} {code}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus picks */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Bonus Picks
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="rounded bg-navy-lighter/50 px-3 py-2 border border-white/5">
            <p className="text-[10px] text-gray-600">Golden Boot</p>
            <p className="text-xs text-white">{picks.goldenBoot || "Not set"}</p>
          </div>
          <div className="rounded bg-navy-lighter/50 px-3 py-2 border border-white/5">
            <p className="text-[10px] text-gray-600">Most Goals (Team)</p>
            <p className="text-xs text-white">{teamName(picks.mostGoalsTeam)}</p>
          </div>
          <div className="rounded bg-navy-lighter/50 px-3 py-2 border border-white/5">
            <p className="text-[10px] text-gray-600">Fewest Conceded</p>
            <p className="text-xs text-white">
              {teamName(picks.fewestConcededTeam)}
            </p>
          </div>
          <div className="rounded bg-navy-lighter/50 px-3 py-2 border border-white/5">
            <p className="text-[10px] text-gray-600">Golden Ball</p>
            <p className="text-xs text-white">{picks.goldenBall || "Not set"}</p>
          </div>
        </div>
      </div>

      {/* Tiebreaker */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Tiebreaker (Final Score)
        </p>
        <p className="text-xs text-white">
          {picks.tiebreaker.homeScore} : {picks.tiebreaker.awayScore}
        </p>
      </div>

      {/* Knockout picks */}
      {picks.knockoutPicks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Knockout Picks ({picks.knockoutPicks.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {picks.knockoutPicks.map((kp) => {
              const team = getTeamByCode(kp.winner);
              return (
                <span
                  key={`${kp.round}-${kp.matchNumber}`}
                  className="inline-flex items-center gap-1 rounded bg-gold/10 border border-gold/20 px-2 py-0.5 text-[11px] text-gold"
                >
                  {team?.flag ?? ""} {kp.winner} ({kp.round})
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantRow({ participant }: { participant: AdminParticipant }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
      >
        <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 sm:px-6">
          <div className="col-span-4 sm:col-span-3">
            <p className="text-sm font-medium text-white truncate">
              {participant.name}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {participant.email}
            </p>
          </div>
          <div className="col-span-3 sm:col-span-3 text-center">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                participant.hasTier1
                  ? "bg-accent/10 text-accent"
                  : "bg-white/5 text-gray-500"
              }`}
            >
              {participant.hasTier1 ? "Submitted" : "Pending"}
            </span>
          </div>
          <div className="col-span-3 sm:col-span-3 text-center">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                participant.hasTier2
                  ? "bg-gold/10 text-gold"
                  : "bg-white/5 text-gray-500"
              }`}
            >
              {participant.hasTier2 ? "Submitted" : "Pending"}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-3 text-right">
            <p className="text-[11px] text-gray-500 hidden sm:block">
              {formatDate(participant.submittedAt)}
            </p>
            <span className="text-gray-500 text-xs" aria-hidden>
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>
      </button>
      {expanded && <ExpandedPicks picks={participant.picks} />}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userIsAdmin = isAdmin(user?.email);

  const fetchData = useCallback(async () => {
    if (!user || !userIsAdmin) return;
    try {
      const res = await fetch(`/api/admin?userId=${user.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to load admin data");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Network error loading admin data");
    } finally {
      setLoading(false);
    }
  }, [user, userIsAdmin]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userIsAdmin) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [authLoading, user, userIsAdmin, fetchData]);

  // Auth still loading
  if (authLoading || loading) {
    return (
      <>
        <PageHeader title="Admin Dashboard" icon="🔧" />
        <section className="py-10 sm:py-14">
          <Container>
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          </Container>
        </section>
      </>
    );
  }

  // Not admin
  if (!user || !userIsAdmin) {
    return (
      <>
        <PageHeader title="Admin Dashboard" icon="🔧" />
        <section className="py-10 sm:py-14">
          <Container>
            <Card className="border-red-500/20">
              <CardBody className="py-12 text-center">
                <span className="text-5xl block mb-4" aria-hidden>
                  🚫
                </span>
                <h2 className="font-heading text-xl font-bold text-white mb-2">
                  Access Denied
                </h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  {user
                    ? "Your account does not have admin access."
                    : "You must be logged in with an admin account to view this page."}
                </p>
              </CardBody>
            </Card>
          </Container>
        </section>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <PageHeader title="Admin Dashboard" icon="🔧" />
        <section className="py-10 sm:py-14">
          <Container>
            <Card className="border-red-500/20">
              <CardBody className="py-8 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </CardBody>
            </Card>
          </Container>
        </section>
      </>
    );
  }

  const { participants, summary } = data ?? {
    participants: [],
    summary: { total: 0, tier1Submitted: 0, tier2Submitted: 0 },
  };

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor participant submissions and picks."
        icon="🔧"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Participants"
              value={summary.total}
              icon="👥"
              accent="text-white"
            />
            <StatCard
              label="Tier 1 Submitted"
              value={summary.tier1Submitted}
              icon="📋"
              accent="text-accent"
            />
            <StatCard
              label="Tier 2 Submitted"
              value={summary.tier2Submitted}
              icon="🏆"
              accent="text-gold"
            />
          </div>

          {/* Participants table */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                All Participants
              </h2>
            </CardHeader>
            {participants.length === 0 ? (
              <CardBody className="py-12 text-center">
                <p className="text-sm text-gray-500">No participants yet.</p>
              </CardBody>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 items-center px-4 py-2 sm:px-6 border-b border-white/10 bg-white/[0.02]">
                  <div className="col-span-4 sm:col-span-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Name / Email
                    </p>
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                      Tier 1
                    </p>
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                      Tier 2
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-3 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 hidden sm:block">
                      Submitted
                    </p>
                  </div>
                </div>

                {/* Rows */}
                {participants.map((p) => (
                  <ParticipantRow key={p.id} participant={p} />
                ))}
              </div>
            )}
          </Card>
        </Container>
      </section>
    </>
  );
}
