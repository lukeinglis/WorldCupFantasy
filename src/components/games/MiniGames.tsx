"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

// Lazy-load games to keep the homepage bundle lean
const PenaltyKick = dynamic(() => import("./PenaltyKick"), { ssr: false });
const GuessTheFlag = dynamic(() => import("./GuessTheFlag"), { ssr: false });

type ActiveGame = null | "penalty" | "flag";

const PK_LS_KEY = "wcf-penalty-highscore";
const FLAG_LS_KEY = "wcf-flag-highscore";

function safeGetScore(key: string): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(key);
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

export default function MiniGames() {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [penaltyBest, setPenaltyBest] = useState(0);
  const [flagBest, setFlagBest] = useState(0);

  // Read high scores on mount
  useEffect(() => {
    setPenaltyBest(safeGetScore(PK_LS_KEY));
    setFlagBest(safeGetScore(FLAG_LS_KEY));
  }, []);

  // Refresh high scores when game closes
  const handleClose = () => {
    setPenaltyBest(safeGetScore(PK_LS_KEY));
    setFlagBest(safeGetScore(FLAG_LS_KEY));
    setActiveGame(null);
  };

  return (
    <section className="py-12 sm:py-16 border-t border-white/10">
      <Container>
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            Kick Around
          </h2>
          <p className="mt-2 text-gray-400">
            Kill time before kickoff with these mini games
          </p>
        </div>

        {/* Active game overlay */}
        {activeGame && (
          <div className="mb-8 rounded-xl border border-white/10 bg-navy-light/80 backdrop-blur-sm p-4 sm:p-6">
            {activeGame === "penalty" && <PenaltyKick onClose={handleClose} />}
            {activeGame === "flag" && <GuessTheFlag onClose={handleClose} />}
          </div>
        )}

        {/* Game cards */}
        {!activeGame && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            {/* Penalty Kick card */}
            <button
              onClick={() => setActiveGame("penalty")}
              className="text-left group"
            >
              <Card hover className="h-full transition-all group-hover:border-accent/30">
                <CardBody className="py-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0" aria-hidden>⚽</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
                          Penalty Kicks
                        </h3>
                        {penaltyBest > 0 && (
                          <span className="inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
                            {penaltyBest}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        How many penalties can you score in a row? Pick your spot and beat the keeper.
                      </p>
                      <span className="inline-block mt-3 font-heading text-xs font-bold uppercase tracking-wide text-accent group-hover:text-green-300 transition-colors">
                        Play Now →
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </button>

            {/* Guess the Flag card */}
            <button
              onClick={() => setActiveGame("flag")}
              className="text-left group"
            >
              <Card hover className="h-full transition-all group-hover:border-accent/30">
                <CardBody className="py-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0" aria-hidden>🏳️</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
                          Guess the Flag
                        </h3>
                        {flagBest > 0 && (
                          <span className="inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
                            {flagBest}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        How many World Cup flags can you identify? One wrong answer and it is game over.
                      </p>
                      <span className="inline-block mt-3 font-heading text-xs font-bold uppercase tracking-wide text-accent group-hover:text-green-300 transition-colors">
                        Play Now →
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
