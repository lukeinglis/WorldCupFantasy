"use client";

import { useEffect, useState } from "react";

const TIER1_DEADLINE = new Date("2026-06-01T00:00:00-05:00");
const TOURNAMENT_START = new Date("2026-06-11T20:00:00-05:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function isZero(t: TimeLeft): boolean {
  return t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg bg-navy-lighter/80 border border-white/10 px-3 py-2 sm:px-4 sm:py-2.5 min-w-[52px] sm:min-w-[68px]">
        <span className="font-heading text-xl font-bold text-accent sm:text-3xl tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function CountdownDisplay({ timeLeft, label, highlight }: { timeLeft: TimeLeft; label: string; highlight?: boolean }) {
  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <div className="text-center">
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${highlight ? "text-accent" : "text-gray-500"}`}>
        {label}
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        <TimeUnit value={days} label="Days" />
        <span className="text-xl font-bold text-gray-600 sm:text-2xl" aria-hidden>:</span>
        <TimeUnit value={hours} label="Hrs" />
        <span className="text-xl font-bold text-gray-600 sm:text-2xl" aria-hidden>:</span>
        <TimeUnit value={minutes} label="Min" />
        <span className="text-xl font-bold text-gray-600 sm:text-2xl" aria-hidden>:</span>
        <TimeUnit value={seconds} label="Sec" />
      </div>
    </div>
  );
}

export default function CountdownTimer() {
  const [tier1Left, setTier1Left] = useState<TimeLeft | null>(null);
  const [kickoffLeft, setKickoffLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    function update() {
      setTier1Left(calculateTimeLeft(TIER1_DEADLINE));
      setKickoffLeft(calculateTimeLeft(TOURNAMENT_START));
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!tier1Left || !kickoffLeft) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        {["Days", "Hrs", "Min", "Sec"].map((label) => (
          <TimeUnit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  const tier1Passed = isZero(tier1Left);
  const kickoffPassed = isZero(kickoffLeft);

  if (kickoffPassed) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 border border-accent/30">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
        </span>
        <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent">
          Tournament is Live!
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      {!tier1Passed ? (
        <CountdownDisplay timeLeft={tier1Left} label="Tier 1 Picks Lock" highlight />
      ) : (
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
            Tier 1 Picks
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 border border-gold/30">
            <span className="text-sm font-heading font-bold text-gold uppercase">Locked</span>
          </span>
        </div>
      )}
      <CountdownDisplay timeLeft={kickoffLeft} label="Kickoff Countdown" />
    </div>
  );
}
