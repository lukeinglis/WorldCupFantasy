"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GameState = "ready" | "kicking" | "result" | "gameover";
type Direction = "left" | "center" | "right";

const LS_KEY = "wcf-penalty-highscore";

function getHighScore(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(LS_KEY);
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

function setHighScoreLS(score: number) {
  if (typeof window === "undefined") return;
  const safe = isFinite(score) && !isNaN(score) ? Math.max(0, score) : 0;
  localStorage.setItem(LS_KEY, String(safe));
}

const DIRECTIONS: Direction[] = ["left", "center", "right"];

interface PenaltyKickProps {
  onClose: () => void;
  onScoreSubmit?: (score: number) => void;
}

export default function PenaltyKick({ onClose, onScoreSubmit }: PenaltyKickProps) {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [shotDir, setShotDir] = useState<Direction | null>(null);
  const [keeperDir, setKeeperDir] = useState<Direction | null>(null);
  const [isGoal, setIsGoal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const streakRef = useRef(streak);
  streakRef.current = streak;

  useEffect(() => {
    setHighScore(getHighScore());
  }, []);

  const shoot = useCallback((dir: Direction) => {
    if (gameState !== "ready") return;

    const keeper = DIRECTIONS[Math.floor(Math.random() * 3)];
    const goal = dir !== keeper;

    setShotDir(dir);
    setKeeperDir(keeper);
    setGameState("kicking");

    // Show result after animations finish
    setTimeout(() => {
      setIsGoal(goal);
      setGameState("result");

      if (goal) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1800);

        setStreak((prev) => {
          const next = prev + 1;
          if (next > getHighScore()) {
            setHighScore(next);
            setHighScoreLS(next);
          }
          return next;
        });

        // Reset for next kick
        setTimeout(() => {
          setShotDir(null);
          setKeeperDir(null);
          setGameState("ready");
        }, 1600);
      } else {
        setTimeout(() => {
          const s = streakRef.current;
          if (s > 0 && onScoreSubmit) onScoreSubmit(s);
          setGameState("gameover");
        }, 1600);
      }
    }, 700);
  }, [gameState, onScoreSubmit]);

  const resetGame = useCallback(() => {
    setStreak(0);
    setGameState("ready");
    setShotDir(null);
    setKeeperDir(null);
    setIsGoal(false);
    setShowConfetti(false);
  }, []);

  // Keeper CSS class based on dive direction
  const keeperClass = keeperDir === "left"
    ? "keeper-dive-left"
    : keeperDir === "right"
      ? "keeper-dive-right"
      : keeperDir === "center"
        ? "keeper-jump-center"
        : "";

  // Ball CSS class
  const ballClass = shotDir === "left"
    ? "ball-fly-left"
    : shotDir === "right"
      ? "ball-fly-right"
      : shotDir === "center"
        ? "ball-fly-center"
        : "";

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <style>{`
        /* Keeper animations */
        @keyframes dive-left {
          0% { transform: translate(0, 0) rotate(0deg); }
          40% { transform: translate(-85px, 10px) rotate(-30deg); }
          100% { transform: translate(-110px, 20px) rotate(-75deg) scaleX(1.2); }
        }
        @keyframes dive-right {
          0% { transform: translate(0, 0) rotate(0deg); }
          40% { transform: translate(85px, 10px) rotate(30deg); }
          100% { transform: translate(110px, 20px) rotate(75deg) scaleX(1.2); }
        }
        @keyframes jump-center {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(0, -30px) scale(1.1); }
          100% { transform: translate(0, -25px) scale(1.15) scaleY(1.1); }
        }
        .keeper-dive-left { animation: dive-left 0.5s cubic-bezier(0.3, 0, 0.7, 1) forwards; }
        .keeper-dive-right { animation: dive-right 0.5s cubic-bezier(0.3, 0, 0.7, 1) forwards; }
        .keeper-jump-center { animation: jump-center 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; }

        /* Ball animations */
        @keyframes fly-left {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          60% { transform: translate(-100px, -140px) scale(0.7) rotate(360deg); opacity: 1; }
          100% { transform: translate(-120px, -175px) scale(0.55) rotate(540deg); opacity: 1; }
        }
        @keyframes fly-center {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          60% { transform: translate(0, -155px) scale(0.7) rotate(360deg); opacity: 1; }
          100% { transform: translate(0, -190px) scale(0.55) rotate(540deg); opacity: 1; }
        }
        @keyframes fly-right {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          60% { transform: translate(100px, -140px) scale(0.7) rotate(360deg); opacity: 1; }
          100% { transform: translate(120px, -175px) scale(0.55) rotate(540deg); opacity: 1; }
        }
        .ball-fly-left { animation: fly-left 0.55s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }
        .ball-fly-center { animation: fly-center 0.55s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }
        .ball-fly-right { animation: fly-right 0.55s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }

        /* Result pop */
        @keyframes result-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Confetti */
        @keyframes confetti-pop {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--dr)) scale(0); opacity: 0; }
        }

        /* Button hover glow */
        .shoot-btn:hover {
          background: rgba(0, 230, 118, 0.15);
          border-color: rgba(0, 230, 118, 0.6);
          box-shadow: 0 0 20px rgba(0, 230, 118, 0.15);
        }
        .shoot-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-white uppercase tracking-wide">Penalty Kicks</span>
          {highScore > 0 && (
            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">
              Best: {highScore}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Close">✕</button>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-center">
          <p className="font-heading text-4xl font-bold text-accent">{streak}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Goals</p>
        </div>
        {streak >= 3 && (
          <p className="text-xs text-gold font-bold animate-pulse">
            {streak >= 9 ? "LEGENDARY!" : streak >= 6 ? "ON FIRE!" : "HOT STREAK!"}
          </p>
        )}
      </div>

      {/* Pitch + Goal */}
      <div
        className="relative rounded-xl overflow-hidden border border-white/10 mx-auto"
        style={{
          aspectRatio: "16 / 10",
          background: "linear-gradient(180deg, #0e2b0e 0%, #1a6b1f 35%, #1B5E20 100%)",
        }}
      >
        {/* Grass stripes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="absolute w-full pointer-events-none" style={{
            top: `${i * 12.5}%`, height: "6.25%",
            background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
          }} />
        ))}

        {/* Goal frame */}
        <div className="absolute" style={{ left: "15%", right: "15%", top: "8%", height: "45%" }}>
          {/* Net */}
          <div className="absolute inset-0" style={{
            background: "rgba(0,0,0,0.45)",
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "14px 14px",
          }} />

          {/* Posts + crossbar */}
          <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{
            background: "linear-gradient(90deg, #ccc, #fff 50%, #aaa)",
            boxShadow: "2px 0 6px rgba(0,0,0,0.4)",
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-[5px]" style={{
            background: "linear-gradient(90deg, #aaa, #fff 50%, #ccc)",
            boxShadow: "-2px 0 6px rgba(0,0,0,0.4)",
          }} />
          <div className="absolute left-0 right-0 top-0 h-[5px]" style={{
            background: "linear-gradient(180deg, #ddd, #fff 50%, #aaa)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          }} />

          {/* Keeper */}
          <div
            className={`absolute ${keeperClass}`}
            style={{
              left: "50%", bottom: "0",
              marginLeft: "-22px",
              zIndex: 5,
              fontSize: "44px", lineHeight: 1,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
            }}
          >
            🧤
          </div>
        </div>

        {/* Penalty box lines */}
        <div className="absolute pointer-events-none" style={{
          left: "22%", right: "22%", top: "53%", bottom: "15%",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }} />

        {/* Penalty spot */}
        <div className="absolute rounded-full pointer-events-none" style={{
          left: "50%", bottom: "22%",
          width: "5px", height: "5px", marginLeft: "-2.5px",
          background: "rgba(255,255,255,0.35)",
        }} />

        {/* Ball */}
        <div
          className={`absolute pointer-events-none ${ballClass}`}
          style={{
            left: "50%", bottom: "20%",
            marginLeft: "-18px",
            zIndex: 8,
            fontSize: "36px", lineHeight: 1,
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))",
          }}
        >
          ⚽
        </div>

        {/* Confetti */}
        {showConfetti && Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute pointer-events-none" style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${15 + Math.random() * 25}%`,
            width: `${4 + Math.random() * 5}px`,
            height: `${4 + Math.random() * 5}px`,
            borderRadius: i % 3 === 0 ? "50%" : "1px",
            background: ["#00E676", "#FFD700", "#fff", "#4CAF50", "#FF5722", "#2196F3"][i % 6],
            ["--dx" as string]: `${(Math.random() - 0.5) * 120}px`,
            ["--dy" as string]: `${30 + Math.random() * 80}px`,
            ["--dr" as string]: `${Math.random() * 360}deg`,
            animation: `confetti-pop ${0.5 + Math.random() * 0.5}s ${Math.random() * 0.15}s ease-out forwards`,
          }} />
        ))}

        {/* Result overlay */}
        {gameState === "result" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 20 }}>
            <span
              className="font-heading text-5xl md:text-6xl font-black uppercase tracking-wider px-5 py-2 rounded-lg"
              style={{
                color: isGoal ? "#00E676" : "#EF4444",
                background: "rgba(10, 22, 40, 0.88)",
                border: `2px solid ${isGoal ? "rgba(0,230,118,0.3)" : "rgba(239,68,68,0.3)"}`,
                animation: "result-pop 0.35s ease-out forwards",
                textShadow: isGoal ? "0 0 25px rgba(0,230,118,0.4)" : "0 0 25px rgba(239,68,68,0.3)",
              }}
            >
              {isGoal ? "GOAL!" : "SAVED!"}
            </span>
          </div>
        )}
      </div>

      {/* Shoot Buttons */}
      {gameState === "ready" && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {(["left", "center", "right"] as Direction[]).map((dir) => (
            <button
              key={dir}
              onClick={() => shoot(dir)}
              className="shoot-btn font-heading rounded-lg border border-white/15 py-3 text-sm font-bold uppercase tracking-wide text-gray-200 transition-all duration-150"
            >
              {dir === "left" ? "⬅ Left" : dir === "right" ? "Right ➡" : "Center ⬆"}
            </button>
          ))}
        </div>
      )}

      {/* Kick indicator (during animation) */}
      {(gameState === "kicking" || gameState === "result") && shotDir && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            You kicked {shotDir}{keeperDir ? `, keeper dove ${keeperDir}` : ""}
          </p>
        </div>
      )}

      {/* Game Over */}
      {gameState === "gameover" && (
        <div className="mt-4 text-center">
          <p className="font-heading text-xl font-bold text-white mb-1">Game Over!</p>
          <p className="text-gray-400 text-sm mb-1">
            {streak === 0 ? "Better luck next time!" : `You scored ${streak} goal${streak === 1 ? "" : "s"} in a row!`}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            You kicked {shotDir}, keeper dove {keeperDir}
          </p>
          {streak > 0 && streak >= highScore && (
            <p className="text-gold text-sm font-bold mb-3">New High Score!</p>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={resetGame} className="font-heading rounded-lg bg-accent px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-navy transition-all hover:bg-green-300">
              Play Again
            </button>
            <button onClick={onClose} className="font-heading rounded-lg border border-white/20 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-gray-300 transition-all hover:bg-white/5">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
