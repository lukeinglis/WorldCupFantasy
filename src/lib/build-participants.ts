import type { Participant, KnockoutPick } from "@/data/participants";
import type { UserRecord, PicksRecord } from "@/lib/storage";

const avatars = ["🦁", "🐯", "🦅", "🐺", "🦊", "🐻", "🦈", "🐊", "🦬", "🐍", "🦖", "🐘", "🦏", "🐎", "🦩", "🐬", "🦇", "🐙"];

export function buildParticipantsFromKv(
  data: { user: UserRecord; picks: PicksRecord | null }[]
): Participant[] {
  return data
    .filter(({ picks }) => picks !== null)
    .map(({ user, picks }, i) => ({
      id: user.id,
      name: user.name,
      avatar: avatars[i % avatars.length],
      groupPredictions: picks!.groupPredictions ?? [],
      bonusPicks: {
        goldenBoot: picks!.goldenBoot ?? "",
        mostGoalsTeam: picks!.mostGoalsTeam ?? "",
        fewestConcededTeam: picks!.fewestConcededTeam ?? "",
        goldenBall: picks!.goldenBall ?? "",
      },
      knockoutPicks: (picks!.knockoutPicks ?? []) as KnockoutPick[],
      tiebreaker: picks!.tiebreaker ?? { homeScore: 0, awayScore: 0 },
      points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
    }));
}
