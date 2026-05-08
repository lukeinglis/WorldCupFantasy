"use client";

import { useEffect, useState } from "react";

const TOURNAMENT_START = new Date("2026-06-11T20:00:00-05:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = TOURNAMENT_START.getTime() - now.getTime();

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

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg bg-navy-lighter/80 border border-white/10 px-3 py-2 sm:px-5 sm:py-3 min-w-[60px] sm:min-w-[80px]">
        <span className="font-heading text-2xl font-bold text-accent sm:text-4xl tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        {["Days", "Hours", "Min", "Sec"].map((label) => (
          <TimeUnit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isLive = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  if (isLive) {
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
    <div className="flex items-center gap-3 sm:gap-4">
      <TimeUnit value={days} label="Days" />
      <span className="text-2xl font-bold text-gray-600 sm:text-3xl" aria-hidden>:</span>
      <TimeUnit value={hours} label="Hours" />
      <span className="text-2xl font-bold text-gray-600 sm:text-3xl" aria-hidden>:</span>
      <TimeUnit value={minutes} label="Min" />
      <span className="text-2xl font-bold text-gray-600 sm:text-3xl" aria-hidden>:</span>
      <TimeUnit value={seconds} label="Sec" />
    </div>
  );
}
