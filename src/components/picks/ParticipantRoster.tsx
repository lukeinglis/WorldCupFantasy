"use client";

import { Card, CardBody } from "@/components/Card";
import type { ParticipantPicks } from "@/lib/picks-types";

export default function ParticipantRoster({ participants }: { participants: ParticipantPicks[] }) {
  const withPicks = participants.filter((p) => p.hasPicks);
  const withoutPicks = participants.filter((p) => !p.hasPicks);

  return (
    <Card className="border-accent/20">
      <CardBody className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" aria-hidden>👥</span>
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
              Who&apos;s In
            </h3>
            <p className="text-xs text-gray-500">
              {withPicks.length} submitted picks{withoutPicks.length > 0 ? `, ${withoutPicks.length} still deciding` : ""}
            </p>
          </div>
        </div>
        {withPicks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {withPicks.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 text-sm font-medium text-accent"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {p.name}
              </span>
            ))}
          </div>
        )}
        {withoutPicks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {withoutPicks.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-500"
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
