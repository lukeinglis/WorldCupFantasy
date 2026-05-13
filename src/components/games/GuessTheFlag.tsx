"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { teams, type Team } from "@/data/teams";

type GameState = "ready" | "playing" | "correct" | "wrong" | "gameover";

interface Round {
  correctTeam: Team;
  options: Team[];
}

const LS_KEY = "wcf-flag-highscore";

function getHighScore(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(LS_KEY);
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

function setHighScore(score: number) {
  if (typeof window === "undefined") return;
  const safe = isFinite(score) && !isNaN(score) ? Math.max(0, score) : 0;
  localStorage.setItem(LS_KEY, String(safe));
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRounds(): Round[] {
  const shuffledTeams = shuffle(teams);
  return shuffledTeams.map((correctTeam) => {
    // Pick 3 wrong answers from the same pool (no repeats)
    const wrongOptions = shuffle(
      teams.filter((t) => t.code !== correctTeam.code)
    ).slice(0, 3);
    const options = shuffle([correctTeam, ...wrongOptions]);
    return { correctTeam, options };
  });
}

export default function GuessTheFlag({ onClose }: { onClose: () => void }) {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHighScoreState(getHighScore());
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    setRounds(generateRounds());
    setCurrentRound(0);
    setScore(0);
    setGameState("playing");
    setSelectedAnswer(null);
    setIsNewHighScore(false);
  }, []);

  const handleAnswer = useCallback(
    (team: Team) => {
      if (gameState !== "playing") return;
      const round = rounds[currentRound];
      if (!round) return;

      setSelectedAnswer(team.code);

      if (team.code === round.correctTeam.code) {
        // Correct!
        const newScore = score + 1;
        setScore(newScore);
        setGameState("correct");

        timeoutRef.current = setTimeout(() => {
          const nextRound = currentRound + 1;
          if (nextRound >= rounds.length) {
            // Beat all 48 flags!
            if (newScore > highScore) {
              setHighScoreState(newScore);
              setHighScore(newScore);
              setIsNewHighScore(true);
            }
            setGameState("gameover");
          } else {
            setCurrentRound(nextRound);
            setSelectedAnswer(null);
            setGameState("playing");
          }
        }, 600);
      } else {
        // Wrong! Game over
        setGameState("wrong");
        timeoutRef.current = setTimeout(() => {
          if (score > highScore) {
            setHighScoreState(score);
            setHighScore(score);
            setIsNewHighScore(true);
          }
          setGameState("gameover");
        }, 1200);
      }
    },
    [gameState, rounds, currentRound, score, highScore]
  );

  const round = rounds[currentRound];

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-white uppercase tracking-wide">
            Guess the Flag
          </span>
          {highScore > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">
              Best: {highScore}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-sm"
          aria-label="Close game"
        >
          ✕
        </button>
      </div>

      {/* Ready screen */}
      {gameState === "ready" && (
        <div className="rounded-xl border border-white/10 bg-navy-light/80 p-8 text-center">
          <span className="text-6xl block mb-4">🏳️</span>
          <h3 className="font-heading text-xl font-bold text-white mb-2">
            Name That Flag!
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Identify World Cup 2026 team flags. One wrong answer ends the game.
            How many can you get right?
          </p>
          <button
            onClick={startGame}
            className="font-heading rounded-lg bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wide text-navy transition-all hover:bg-green-300"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Playing / Result */}
      {(gameState === "playing" || gameState === "correct" || gameState === "wrong") && round && (
        <>
          {/* Score bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl font-bold text-accent">{score}</span>
              <span className="text-xs text-gray-500">correct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {currentRound + 1} / {rounds.length}
              </span>
              {score >= 10 && (
                <span className="text-xs text-gold font-bold animate-pulse">
                  {score >= 40 ? "WORLD CLASS!" : score >= 25 ? "INCREDIBLE!" : score >= 10 ? "GREAT RUN!" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{
                width: `${rounds.length > 0 ? (currentRound / rounds.length) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Flag display */}
          <div className="rounded-xl border border-white/10 bg-navy-light/80 p-6 text-center mb-4">
            <div
              className="text-8xl sm:text-9xl leading-none select-none"
              style={{ filter: gameState === "wrong" ? "grayscale(1)" : "none" }}
            >
              {round.correctTeam.flag}
            </div>
            {gameState === "wrong" && (
              <p className="mt-3 text-sm text-red-400 font-bold">
                It was {round.correctTeam.name}!
              </p>
            )}
          </div>

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-2">
            {round.options.map((option) => {
              let btnClass = "border-white/10 hover:border-accent/50 hover:bg-accent/5";
              const isSelected = selectedAnswer === option.code;
              const isCorrectAnswer = option.code === round.correctTeam.code;

              if (gameState === "correct" || gameState === "wrong") {
                if (isCorrectAnswer) {
                  btnClass = "border-accent bg-accent/20 ring-2 ring-accent/50";
                } else if (isSelected && !isCorrectAnswer) {
                  btnClass = "border-red-500 bg-red-500/20 ring-2 ring-red-500/50";
                } else {
                  btnClass = "border-white/5 opacity-50";
                }
              }

              return (
                <button
                  key={option.code}
                  onClick={() => handleAnswer(option)}
                  disabled={gameState !== "playing"}
                  className={`rounded-lg border px-4 py-3 text-left transition-all ${btnClass} ${
                    gameState === "playing" ? "cursor-pointer active:scale-95" : "cursor-default"
                  }`}
                >
                  <span className="text-sm font-medium text-white block truncate">
                    {option.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    Group {option.group}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Game Over */}
      {gameState === "gameover" && (
        <div className="rounded-xl border border-white/10 bg-navy-light/80 p-8 text-center">
          <span className="text-5xl block mb-3">
            {score >= 48 ? "👑" : score >= 30 ? "🌟" : score >= 15 ? "⚽" : "😅"}
          </span>
          <p className="font-heading text-3xl font-bold text-white mb-1">{score}</p>
          <p className="text-sm text-gray-400 mb-4">
            {score >= 48
              ? "PERFECT! You identified every single flag!"
              : score >= 30
                ? "Outstanding! You really know your World Cup teams!"
                : score >= 15
                  ? "Great run! You know your flags well."
                  : score >= 5
                    ? "Not bad! Keep practicing."
                    : "Better luck next time!"}
          </p>
          {isNewHighScore && score > 0 && (
            <p className="text-gold text-sm font-bold mb-3 animate-pulse">
              New High Score!
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={startGame}
              className="font-heading rounded-lg bg-accent px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-navy transition-all hover:bg-green-300"
            >
              Play Again
            </button>
            <button
              onClick={onClose}
              className="font-heading rounded-lg border border-white/20 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
