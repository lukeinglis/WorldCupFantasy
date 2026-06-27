"use client";

import { groupLabels } from "@/data/teams";
import {
  areTier1PicksRevealed,
  TOURNAMENT_START,
} from "@/lib/tournament-dates";
import { usePicksData } from "@/hooks/usePicksData";
import GroupPredictionGrid from "@/components/picks/GroupPredictionGrid";
import BonusPicksSection from "@/components/picks/BonusPicksSection";
import ParticipantDetail from "@/components/picks/ParticipantDetail";
import HiddenPicksBanner from "@/components/picks/HiddenPicksBanner";
import ParticipantRoster from "@/components/picks/ParticipantRoster";

export default function PicksTabContent() {
  const { user, participantsList, standingsMap, loading, kvConfigured } = usePicksData();

  const tier1Revealed = areTier1PicksRevealed();
  const visibleParticipants = participantsList.filter((p) => p.hasPicks);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Loading picks...</p>
      </div>
    );
  }

  const hasHiddenPicks = !tier1Revealed && participantsList.some((p) => p.hasPicks);

  return (
    <div className="space-y-10">
      {!kvConfigured && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 px-5 py-4 text-center">
          <p className="text-sm text-gold font-medium">
            Storage is not configured yet. Picks will appear here once the administrator sets up Vercel KV.
          </p>
        </div>
      )}

      {hasHiddenPicks && (
        <div className="space-y-6">
          <HiddenPicksBanner revealDate={TOURNAMENT_START} tier={1} />
          <ParticipantRoster participants={participantsList} />
        </div>
      )}

      {/* Group Predictions */}
      <div>
        <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
          Group Finishing Order Predictions
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {tier1Revealed
            ? "Each participant predicted the finishing order for all 12 groups. Green shading = predicted to advance (1st/2nd)."
            : "Specific picks will be revealed when the tournament begins. You can see your own picks below."}
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groupLabels.map((group) => (
            <GroupPredictionGrid
              key={group}
              group={group}
              participantsList={visibleParticipants}
              picksRevealed={tier1Revealed}
              standings={standingsMap[group]}
              currentUserId={user?.id}
            />
          ))}
        </div>
      </div>

      {/* Bonus Picks */}
      <div>
        <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
          Bonus Picks
        </h2>
        <BonusPicksSection participantsList={visibleParticipants} picksRevealed={tier1Revealed} />
      </div>

      {/* By Participant */}
      <div>
        <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
          By Participant
        </h2>
        {visibleParticipants.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3" aria-hidden>👤</span>
            <p className="text-gray-400 text-sm">No participants have submitted picks yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {visibleParticipants.map((p) => (
              <ParticipantDetail key={p.id} participant={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
