"use client";

import { Card, CardBody } from "@/components/Card";
import { formatRevealDate } from "@/lib/tournament-dates";

export default function HiddenPicksBanner({ revealDate, tier }: { revealDate: Date; tier: number }) {
  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardBody className="py-12 text-center">
        <span className="text-5xl block mb-4" aria-hidden>🔒</span>
        <h3 className="font-heading text-xl font-bold text-white mb-2">
          Tier {tier} Picks Are Hidden
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Picks will be revealed when {tier === 1 ? "the tournament begins" : "the knockout stage begins"} on{" "}
          <span className="text-gold font-medium">{formatRevealDate(revealDate)}</span>.
          Each participant can only see their own picks until then.
        </p>
      </CardBody>
    </Card>
  );
}
