"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GameState = "aiming" | "shooting" | "result" | "gameover";
type ShotZone = 0 | 1 | 2 | 3 | 4 | 5;

const ZONE_LABELS = [
  "top-left", "top-center", "top-right",
  "bottom-left", "bottom-center", "bottom-right",
] as const;

function getKeeperSaveZones(streak: number): number[] {
  const coverCount = Math.min(4, 1 + Math.floor(streak / 3));
  const zones: Set<number> = new Set();
  while (zones.size < coverCount) {
    zones.add(Math.floor(Math.random() * 6));
  }
  return Array.from(zones);
}

const LS_KEY = "wcf-penalty-highscore";

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

// Zone grid positions as percentages within the goal (left%, top%)
const ZONE_GRID: Record<number, { col: number; row: number }> = {
  0: { col: 0, row: 0 }, // top-left
  1: { col: 1, row: 0 }, // top-center
  2: { col: 2, row: 0 }, // top-right
  3: { col: 0, row: 1 }, // bottom-left
  4: { col: 1, row: 1 }, // bottom-center
  5: { col: 2, row: 1 }, // bottom-right
};

// Where the gloves land for each zone (% from goal center)
const GLOVE_POSITIONS: Record<number, { left: string; top: string; rotate: string }> = {
  0: { left: "12%", top: "15%", rotate: "-25deg" },
  1: { left: "42%", top: "5%", rotate: "0deg" },
  2: { left: "72%", top: "15%", rotate: "25deg" },
  3: { left: "10%", top: "60%", rotate: "-35deg" },
  4: { left: "42%", top: "65%", rotate: "0deg" },
  5: { left: "72%", top: "60%", rotate: "35deg" },
};

interface PenaltyKickProps {
  onClose: () => void;
  onScoreSubmit?: (score: number) => void;
}

export default function PenaltyKick({ onClose, onScoreSubmit }: PenaltyKickProps) {
  const [gameState, setGameState] = useState<GameState>("aiming");
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [resultText, setResultText] = useState("");
  const [isGoal, setIsGoal] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);

  const [ballZone, setBallZone] = useState<number | null>(null);
  const [ballFlying, setBallFlying] = useState(false);
  const [glovesZone, setGlovesZone] = useState<number | null>(null);
  const [glovesDiving, setGlovesDiving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const streakRef = useRef(streak);
  streakRef.current = streak;

  useEffect(() => {
    setHighScoreState(getHighScore());
  }, []);

  const shoot = useCallback(
    (zone: ShotZone) => {
      if (gameState !== "aiming") return;
      setGameState("shooting");
      setHoveredZone(null);

      const saveZones = getKeeperSaveZones(streak);
      const saved = saveZones.includes(zone);
      const keeperDiveZone = saved ? zone : saveZones[0];

      // Kick the ball
      setBallZone(zone);
      setBallFlying(true);

      // Gloves dive (slight delay)
      setTimeout(() => {
        setGlovesZone(keeperDiveZone);
        setGlovesDiving(true);
      }, 80);

      // Show result
      setTimeout(() => {
        setGameState("result");

        if (saved) {
          setResultText("SAVED!");
          setIsGoal(false);
          setTimeout(() => {
            const currentStreak = streakRef.current;
            if (currentStreak > 0 && onScoreSubmit) onScoreSubmit(currentStreak);
            setGameState("gameover");
          }, 1400);
        } else {
          setResultText("GOAL!");
          setIsGoal(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);

          setStreak((prev) => {
            const newStreak = prev + 1;
            if (newStreak > getHighScore()) {
              setHighScoreState(newStreak);
              setHighScore(newStreak);
            }
            return newStreak;
          });

          setTimeout(() => {
            setBallFlying(false);
            setBallZone(null);
            setGlovesDiving(false);
            setGlovesZone(null);
            setResultText("");
            setGameState("aiming");
          }, 1400);
        }
      }, 550);
    },
    [gameState, streak, onScoreSubmit]
  );

  const resetGame = useCallback(() => {
    setStreak(0);
    setGameState("aiming");
    setResultText("");
    setIsGoal(false);
    setHoveredZone(null);
    setBallFlying(false);
    setBallZone(null);
    setGlovesDiving(false);
    setGlovesZone(null);
    setShowConfetti(false);
  }, []);

  // Ball target position (center of the zone cell)
  const ballTarget = ballZone !== null ? ZONE_GRID[ballZone] : null;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <style>{`
        @keyframes ball-kick {
          0% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes confetti-burst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
        @keyframes result-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-white uppercase tracking-wide">
            Penalty Kicks
          </span>
          {highScore > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">
              Best: {highScore}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-sm" aria-label="Close game">
          ✕
        </button>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="text-center">
          <p className="font-heading text-3xl font-bold text-accent">{streak}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Goals</p>
        </div>
        {streak >= 3 && (
          <p className="text-xs text-gold font-bold animate-pulse">
            {streak >= 9 ? "LEGENDARY!" : streak >= 6 ? "ON FIRE!" : "HOT STREAK!"}
          </p>
        )}
      </div>

      {/* Game Area: compact, goal-focused */}
      <div
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          background: "linear-gradient(180deg, #0d2e0d 0%, #1B5E20 40%, #165a19 100%)",
        }}
      >
        {/* Grass stripes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full pointer-events-none"
            style={{
              top: `${i * 12.5}%`,
              height: "6.25%",
              background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
            }}
          />
        ))}

        {/* Goal frame: positioned in upper portion */}
        <div
          className="absolute"
          style={{ left: "10%", right: "10%", top: "5%", height: "55%" }}
        >
          {/* Net background */}
          <div
            className="absolute inset-0 rounded-t-sm"
            style={{
              background: "rgba(0,0,0,0.5)",
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "16px 16px",
            }}
          />

          {/* Left post */}
          <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{
            background: "linear-gradient(90deg, #ccc, #fff 60%, #bbb)",
            boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
          }} />

          {/* Right post */}
          <div className="absolute right-0 top-0 bottom-0 w-[5px]" style={{
            background: "linear-gradient(90deg, #bbb, #fff 40%, #ccc)",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.3)",
          }} />

          {/* Crossbar */}
          <div className="absolute left-0 right-0 top-0 h-[5px]" style={{
            background: "linear-gradient(180deg, #ddd, #fff 60%, #bbb)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }} />

          {/* ===== CLICKABLE ZONES (3x2 grid inside goal) ===== */}
          {gameState === "aiming" && (
            <div className="absolute inset-[5px] grid grid-cols-3 grid-rows-2 gap-[2px]" style={{ zIndex: 10 }}>
              {[0, 1, 2, 3, 4, 5].map((zone) => (
                <button
                  key={zone}
                  className="relative cursor-crosshair group rounded-sm overflow-hidden"
                  onClick={() => shoot(zone as ShotZone)}
                  onMouseEnter={() => setHoveredZone(zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                  aria-label={`Shoot ${ZONE_LABELS[zone]}`}
                  style={{
                    background: hoveredZone === zone
                      ? "rgba(0, 230, 118, 0.2)"
                      : "rgba(255,255,255,0.02)",
                    border: hoveredZone === zone
                      ? "2px solid rgba(0, 230, 118, 0.6)"
                      : "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Target dot */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: hoveredZone === zone ? "10px" : "5px",
                      height: hoveredZone === zone ? "10px" : "5px",
                      background: hoveredZone === zone
                        ? "rgba(0, 230, 118, 0.8)"
                        : "rgba(255,255,255,0.15)",
                      boxShadow: hoveredZone === zone
                        ? "0 0 12px rgba(0, 230, 118, 0.4)"
                        : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* ===== GOALKEEPER GLOVES ===== */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: glovesDiving && glovesZone !== null ? GLOVE_POSITIONS[glovesZone].left : "42%",
              top: glovesDiving && glovesZone !== null ? GLOVE_POSITIONS[glovesZone].top : "40%",
              transform: `rotate(${glovesDiving && glovesZone !== null ? GLOVE_POSITIONS[glovesZone].rotate : "0deg"})`,
              transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.3, 1)",
              zIndex: 5,
              fontSize: "42px",
              lineHeight: 1,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            }}
          >
            🧤
          </div>
        </div>

        {/* Penalty area lines */}
        <div className="absolute pointer-events-none" style={{
          left: "20%", right: "20%", top: "60%", bottom: "12%",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }} />

        {/* Penalty spot */}
        <div className="absolute pointer-events-none" style={{
          left: "50%", bottom: "18%",
          width: "6px", height: "6px",
          marginLeft: "-3px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.4)",
        }} />

        {/* ===== BALL ===== */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: ballFlying && ballTarget
              ? `calc(10% + ${(ballTarget.col * 33.33 + 16.66)}% * 0.8)`
              : "50%",
            top: ballFlying && ballTarget
              ? `calc(5% + ${(ballTarget.row * 50 + 25)}% * 0.55)`
              : "78%",
            transform: `translate(-50%, -50%) scale(${ballFlying ? 0.7 : 1}) rotate(${ballFlying ? "540deg" : "0deg"})`,
            transition: ballFlying
              ? "all 0.45s cubic-bezier(0.15, 0.8, 0.3, 1)"
              : "all 0.3s ease-out",
            zIndex: 8,
            fontSize: "36px",
            lineHeight: 1,
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
          }}
        >
          ⚽
        </div>

        {/* ===== CONFETTI ===== */}
        {showConfetti && Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${10 + Math.random() * 30}%`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              borderRadius: i % 3 === 0 ? "50%" : "1px",
              background: ["#00E676", "#FFD700", "#fff", "#4CAF50", "#FF5722", "#2196F3"][i % 6],
              ["--dx" as string]: `${(Math.random() - 0.5) * 100}px`,
              ["--dy" as string]: `${40 + Math.random() * 80}px`,
              animation: `confetti-burst ${0.6 + Math.random() * 0.6}s ${Math.random() * 0.2}s ease-out forwards`,
            }}
          />
        ))}

        {/* ===== RESULT TEXT ===== */}
        {resultText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 20 }}>
            <span
              className="font-heading text-5xl md:text-6xl font-black uppercase tracking-wider px-6 py-2 rounded-lg"
              style={{
                color: isGoal ? "#00E676" : "#EF4444",
                background: "rgba(10, 22, 40, 0.9)",
                backdropFilter: "blur(6px)",
                border: `2px solid ${isGoal ? "rgba(0,230,118,0.3)" : "rgba(239,68,68,0.3)"}`,
                animation: "result-pop 0.3s ease-out",
                textShadow: isGoal
                  ? "0 0 30px rgba(0,230,118,0.5)"
                  : "0 0 30px rgba(239,68,68,0.4)",
              }}
            >
              {resultText}
            </span>
          </div>
        )}

        {/* Aiming hint */}
        {gameState === "aiming" && streak === 0 && (
          <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none" style={{ zIndex: 15 }}>
            <span className="inline-block bg-navy/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-300">
              Tap a zone in the goal to shoot
            </span>
          </div>
        )}
      </div>

      {/* Difficulty indicator */}
      {gameState === "aiming" && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Keeper:</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-1.5 rounded-full ${
                  i < Math.min(4, 1 + Math.floor(streak / 3)) ? "bg-accent" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === "gameover" && (
        <div className="mt-4 text-center">
          <p className="font-heading text-xl font-bold text-white mb-1">Game Over!</p>
          <p className="text-gray-400 text-sm mb-4">
            {streak === 0
              ? "Better luck next time!"
              : streak === 1
                ? "You scored 1 goal."
                : `You scored ${streak} goals in a row!`}
          </p>
          {streak > 0 && streak >= highScore && (
            <p className="text-gold text-sm font-bold mb-3">New High Score!</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetGame}
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
