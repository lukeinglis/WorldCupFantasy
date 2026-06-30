"use client";

import BracketPicker from "@/components/BracketPicker";
import type { KnockoutMatch } from "@/components/BracketPicker";
import type { KnockoutPick } from "@/data/participants";

export default function ReadOnlyBracket({
  knockoutMatches,
  picks,
  results,
}: {
  knockoutMatches: KnockoutMatch[];
  picks: KnockoutPick[];
  results?: Record<string, string>;
}) {
  return (
    <BracketPicker
      knockoutMatches={knockoutMatches}
      picks={picks}
      onPicksChange={() => {}}
      disabled
      readOnly
      results={results}
    />
  );
}
