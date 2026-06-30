import { getTeamByCode } from "@/data/teams";
import { getAllKnockoutMatches } from "@/data/knockout-bracket";
import { knockoutRoundMatchCounts } from "@/data/participants";

const BRACKET_PATH: Record<string, { round: string; matchNumber: number; slot: "home" | "away" }> = {
  "round_of_32_4":  { round: "round_of_16", matchNumber: 1, slot: "home" },
  "round_of_32_6":  { round: "round_of_16", matchNumber: 1, slot: "away" },
  "round_of_32_1":  { round: "round_of_16", matchNumber: 2, slot: "home" },
  "round_of_32_2":  { round: "round_of_16", matchNumber: 2, slot: "away" },
  "round_of_32_3":  { round: "round_of_16", matchNumber: 3, slot: "home" },
  "round_of_32_5":  { round: "round_of_16", matchNumber: 3, slot: "away" },
  "round_of_32_7":  { round: "round_of_16", matchNumber: 4, slot: "home" },
  "round_of_32_9":  { round: "round_of_16", matchNumber: 4, slot: "away" },
  "round_of_32_11": { round: "round_of_16", matchNumber: 5, slot: "home" },
  "round_of_32_12": { round: "round_of_16", matchNumber: 5, slot: "away" },
  "round_of_32_8":  { round: "round_of_16", matchNumber: 6, slot: "home" },
  "round_of_32_10": { round: "round_of_16", matchNumber: 6, slot: "away" },
  "round_of_32_15": { round: "round_of_16", matchNumber: 7, slot: "home" },
  "round_of_32_14": { round: "round_of_16", matchNumber: 7, slot: "away" },
  "round_of_32_13": { round: "round_of_16", matchNumber: 8, slot: "home" },
  "round_of_32_16": { round: "round_of_16", matchNumber: 8, slot: "away" },
  "round_of_16_1": { round: "quarter", matchNumber: 1, slot: "home" },
  "round_of_16_2": { round: "quarter", matchNumber: 1, slot: "away" },
  "round_of_16_5": { round: "quarter", matchNumber: 2, slot: "home" },
  "round_of_16_6": { round: "quarter", matchNumber: 2, slot: "away" },
  "round_of_16_3": { round: "quarter", matchNumber: 3, slot: "home" },
  "round_of_16_4": { round: "quarter", matchNumber: 3, slot: "away" },
  "round_of_16_7": { round: "quarter", matchNumber: 4, slot: "home" },
  "round_of_16_8": { round: "quarter", matchNumber: 4, slot: "away" },
  "quarter_1": { round: "semi", matchNumber: 1, slot: "home" },
  "quarter_2": { round: "semi", matchNumber: 1, slot: "away" },
  "quarter_3": { round: "semi", matchNumber: 2, slot: "home" },
  "quarter_4": { round: "semi", matchNumber: 2, slot: "away" },
  "semi_1": { round: "final", matchNumber: 1, slot: "home" },
  "semi_2": { round: "final", matchNumber: 1, slot: "away" },
};

const SLOT_H = 78;
const CARD_WIDTHS: Record<string, number> = {
  round_of_32: 108, round_of_16: 116, quarter: 124, semi: 132, final: 148,
};

const ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi"];

function TeamRow({ code, size, scoring }: {
  code: string | null;
  size: "sm" | "md" | "lg";
  scoring?: "correct" | "wrong" | "eliminated" | null;
}) {
  const team = code ? getTeamByCode(code) : null;
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  const flagSize = size === "lg" ? "text-lg" : "text-base";
  const py = size === "lg" ? "py-2" : "py-1.5";

  const isNegative = scoring === "wrong" || scoring === "eliminated";
  let textColor = "text-gray-200";
  if (scoring === "correct") textColor = "text-green-400";
  else if (isNegative) textColor = "text-gray-600 line-through";

  return (
    <div className={`flex items-center gap-1.5 px-2 ${py} ${code ? "" : "opacity-25"} ${isNegative ? "opacity-35" : ""}`}>
      <span className={`${flagSize} leading-none ${isNegative ? "grayscale" : ""}`}>{team?.flag ?? "🏳️"}</span>
      <span className={`${textSize} font-bold ${textColor}`}>{team?.code ?? "TBD"}</span>
    </div>
  );
}

function MatchCard({ home, away, date, width, size, homeScoring, awayScoring }: {
  home: string | null;
  away: string | null;
  date?: string;
  width: number;
  size: "sm" | "md" | "lg";
  homeScoring?: "correct" | "wrong" | "eliminated" | null;
  awayScoring?: "correct" | "wrong" | "eliminated" | null;
}) {
  let borderColor = "border-white/15";
  if (homeScoring === "correct" || awayScoring === "correct") borderColor = "border-green-500/30";
  else if (homeScoring === "wrong" || awayScoring === "wrong") borderColor = "border-red-500/30";

  return (
    <div className={`${borderColor} border rounded bg-navy-light/60 overflow-hidden shrink-0`} style={{ width: `${width}px` }}>
      {date && (
        <div className="text-[9px] text-gray-500 text-center py-0.5 bg-white/[0.03] border-b border-white/10 font-medium">
          {date}
        </div>
      )}
      <TeamRow code={home} size={size} scoring={homeScoring} />
      <div className="border-t border-white/10" />
      <TeamRow code={away} size={size} scoring={awayScoring} />
    </div>
  );
}

function getMatchScoring(
  key: string,
  home: string | null,
  away: string | null,
  actualResults?: Record<string, string>,
  eliminatedTeams?: Set<string>,
): { homeScoring: "correct" | "wrong" | "eliminated" | null; awayScoring: "correct" | "wrong" | "eliminated" | null } {
  const actual = actualResults?.[key];
  if (actual) {
    return {
      homeScoring: home ? (home === actual ? "correct" : "wrong") : null,
      awayScoring: away ? (away === actual ? "correct" : "wrong") : null,
    };
  }
  return {
    homeScoring: home && eliminatedTeams?.has(home) ? "eliminated" : null,
    awayScoring: away && eliminatedTeams?.has(away) ? "eliminated" : null,
  };
}

function RoundCol({ matchNumbers, allTeams, round, dates, actualResults, eliminatedTeams }: {
  matchNumbers: number[];
  allTeams: Map<string, { home: string | null; away: string | null }>;
  round: string;
  dates: Map<string, string>;
  actualResults?: Record<string, string>;
  eliminatedTeams?: Set<string>;
}) {
  const roundIdx = ROUND_ORDER.indexOf(round);
  const slotH = SLOT_H * Math.pow(2, roundIdx);
  const width = CARD_WIDTHS[round] ?? 108;
  const size = roundIdx <= 1 ? "sm" as const : "md" as const;
  const label = round === "round_of_32" ? "R32" : round === "round_of_16" ? "R16" : round === "quarter" ? "QF" : "SF";

  return (
    <div className="flex flex-col shrink-0">
      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center mb-1">{label}</div>
      {matchNumbers.map((mn) => {
        const key = `${round}_${mn}`;
        const teams = allTeams.get(key);
        const { homeScoring, awayScoring } = getMatchScoring(key, teams?.home ?? null, teams?.away ?? null, actualResults, eliminatedTeams);
        return (
          <div key={key} className="flex items-center justify-center" style={{ height: `${slotH}px` }}>
            <MatchCard
              home={teams?.home ?? null}
              away={teams?.away ?? null}
              date={dates.get(key)}
              width={width}
              size={size}
              homeScoring={homeScoring}
              awayScoring={awayScoring}
            />
          </div>
        );
      })}
    </div>
  );
}

function buildBracketTeams(
  picks: Record<string, string>,
): { allTeams: Map<string, { home: string | null; away: string | null }>; dates: Map<string, string> } {
  const allMatches = getAllKnockoutMatches();
  const allTeams = new Map<string, { home: string | null; away: string | null }>();
  const dates = new Map<string, string>();

  for (const m of allMatches) {
    const key = `${m.round}_${m.matchNumber}`;
    allTeams.set(key, { home: m.homeTeam, away: m.awayTeam });
    if (m.utcDate) {
      const d = new Date(m.utcDate);
      if (!isNaN(d.getTime()) && d.getTime() > 0) {
        dates.set(key, d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      }
    }
  }

  for (const round of ROUND_ORDER) {
    const matchCount = knockoutRoundMatchCounts[round] ?? 0;
    for (let m = 1; m <= matchCount; m++) {
      const key = `${round}_${m}`;
      const winner = picks[key];
      if (!winner) continue;
      const next = BRACKET_PATH[key];
      if (!next) continue;
      const nextKey = `${next.round}_${next.matchNumber}`;
      const current = allTeams.get(nextKey) ?? { home: null, away: null };
      allTeams.set(nextKey, { ...current, [next.slot]: winner });
    }
  }

  // 3rd place: losers from semis
  const thirdPlace = allTeams.get("third_place_1") ?? { home: null, away: null };
  for (let sf = 1; sf <= 2; sf++) {
    const sfKey = `semi_${sf}`;
    const sfWinner = picks[sfKey];
    const sfTeams = allTeams.get(sfKey);
    if (sfWinner && sfTeams) {
      const loser = sfTeams.home === sfWinner ? sfTeams.away : sfTeams.home;
      if (loser) {
        if (sf === 1) thirdPlace.home = loser;
        else thirdPlace.away = loser;
      }
    }
  }
  allTeams.set("third_place_1", thirdPlace);

  return { allTeams, dates };
}

const LEFT_R32 = [4, 6, 1, 2, 11, 12, 8, 10];
const RIGHT_R32 = [3, 5, 7, 9, 15, 14, 13, 16];

interface BracketDisplayProps {
  picks: Record<string, string>;
  actualResults?: Record<string, string>;
  eliminatedTeams?: Set<string>;
}

export default function BracketDisplay({ picks, actualResults, eliminatedTeams }: BracketDisplayProps) {
  const { allTeams, dates } = buildBracketTeams(picks);

  const finalKey = "final_1";
  const finalTeams = allTeams.get(finalKey);
  const finalScoring = getMatchScoring(finalKey, finalTeams?.home ?? null, finalTeams?.away ?? null, actualResults, eliminatedTeams);

  const thirdKey = "third_place_1";
  const thirdTeams = allTeams.get(thirdKey);
  const thirdScoring = getMatchScoring(thirdKey, thirdTeams?.home ?? null, thirdTeams?.away ?? null, actualResults, eliminatedTeams);

  return (
    <>
      {/* Desktop bracket */}
      <div className="hidden lg:block overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-2">
        <div className="flex items-start justify-center gap-2 min-w-fit py-4">
          <RoundCol round="round_of_32" matchNumbers={LEFT_R32} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
          <RoundCol round="round_of_16" matchNumbers={[1, 2, 5, 6]} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
          <RoundCol round="quarter" matchNumbers={[1, 2]} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
          <RoundCol round="semi" matchNumbers={[1]} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />

          <div className="flex flex-col shrink-0 mx-3">
            <div className="text-xs text-gold font-bold uppercase tracking-widest text-center mb-1">Final</div>
            <div className="flex items-center justify-center" style={{ height: `${SLOT_H * 8}px` }}>
              <div className="flex flex-col items-center gap-6">
                <MatchCard home={finalTeams?.home ?? null} away={finalTeams?.away ?? null} date={dates.get(finalKey)} width={CARD_WIDTHS.final} size="lg" homeScoring={finalScoring.homeScoring} awayScoring={finalScoring.awayScoring} />
                <div>
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center mb-1">3rd Place</div>
                  <MatchCard home={thirdTeams?.home ?? null} away={thirdTeams?.away ?? null} width={CARD_WIDTHS.semi} size="md" homeScoring={thirdScoring.homeScoring} awayScoring={thirdScoring.awayScoring} />
                </div>
              </div>
            </div>
          </div>

          <RoundCol round="semi" matchNumbers={[2]} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
          <RoundCol round="quarter" matchNumbers={[3, 4]} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
          <RoundCol round="round_of_16" matchNumbers={[3, 4, 7, 8]} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
          <RoundCol round="round_of_32" matchNumbers={RIGHT_R32} allTeams={allTeams} dates={dates} actualResults={actualResults} eliminatedTeams={eliminatedTeams} />
        </div>
      </div>

      {/* Mobile list view */}
      <div className="lg:hidden space-y-6">
        {[...ROUND_ORDER, "third_place", "final"].map((round) => {
          const matchCount = knockoutRoundMatchCounts[round] ?? 0;
          const label = round === "round_of_32" ? "Round of 32" : round === "round_of_16" ? "Round of 16" :
            round === "quarter" ? "Quarterfinals" : round === "semi" ? "Semifinals" :
            round === "third_place" ? "Third Place" : "Final";

          return (
            <div key={round}>
              <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white mb-2">{label}</h3>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: matchCount }, (_, i) => i + 1).map((mn) => {
                  const key = `${round}_${mn}`;
                  const teams = allTeams.get(key);
                  const { homeScoring, awayScoring } = getMatchScoring(key, teams?.home ?? null, teams?.away ?? null, actualResults, eliminatedTeams);
                  return (
                    <MatchCard
                      key={key}
                      home={teams?.home ?? null}
                      away={teams?.away ?? null}
                      width={9999}
                      size="sm"
                      homeScoring={homeScoring}
                      awayScoring={awayScoring}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
