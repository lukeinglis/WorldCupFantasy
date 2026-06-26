"use client";

import { Card, CardBody } from "@/components/Card";

export default function KnockoutBracketSection() {
  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardBody className="py-12 text-center">
        <span className="text-5xl block mb-4" aria-hidden>🔒</span>
        <h3 className="font-heading text-xl font-bold text-white mb-2">
          Knockout Bracket Not Yet Available
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          The knockout bracket will be available after the group stage ends on June 27, 2026.
          Tier 2 picks must be submitted before the Round of 32 begins on June 28.
        </p>
      </CardBody>
    </Card>
  );
}
