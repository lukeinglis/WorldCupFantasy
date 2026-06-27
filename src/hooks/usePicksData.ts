"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { ParticipantPicks, GroupStanding } from "@/lib/picks-types";
import { computeStandingsFromGroupMatches } from "@/lib/picks-types";

interface StandingsData {
  group: string;
  standings: GroupStanding[];
}

export function usePicksData() {
  const { user } = useAuth();
  const [participantsList, setParticipantsList] = useState<ParticipantPicks[]>([]);
  const [standingsMap, setStandingsMap] = useState<Record<string, GroupStanding[]>>({});
  const [loading, setLoading] = useState(true);
  const [kvConfigured, setKvConfigured] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const url = user ? `/api/participants?userId=${user.id}` : "/api/participants";
        const [participantsRes, standingsRes, matchesRes] = await Promise.all([
          fetch(url),
          fetch("/api/football/standings"),
          fetch("/api/football/matches"),
        ]);

        const participantsData = await participantsRes.json();
        setKvConfigured(participantsData.kvConfigured !== false);
        setParticipantsList(participantsData.participants ?? []);

        let gotStandings = false;
        if (standingsRes.ok) {
          const standingsData = await standingsRes.json();
          const map: Record<string, GroupStanding[]> = {};
          for (const g of (standingsData.standings ?? []) as StandingsData[]) {
            map[g.group] = g.standings;
          }
          if (Object.keys(map).length > 0) {
            setStandingsMap(map);
            gotStandings = true;
          }
        }

        if (!gotStandings && matchesRes.ok) {
          const matchesData = await matchesRes.json();
          const matches = matchesData.matches ?? [];
          const groupMatches = matches.filter(
            (m: { stage: string; status: string; group: string | null }) =>
              m.stage === "group" && m.status === "FINISHED" && m.group
          );
          if (groupMatches.length > 0) {
            setStandingsMap(computeStandingsFromGroupMatches(groupMatches));
          }
        }
      } catch {
        // Silently fail, show empty state
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  return { user, participantsList, standingsMap, loading, kvConfigured };
}
