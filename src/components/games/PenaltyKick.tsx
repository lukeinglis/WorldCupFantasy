"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GameState = "ready" | "kicking" | "result" | "gameover";
type Zone = 0 | 1 | 2 | 3 | 4 | 5;

const ZONE_NAMES = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];

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

const ALL_ZONES: Zone[] = [0, 1, 2, 3, 4, 5];

interface PenaltyKickProps {
  onClose: () => void;
  onScoreSubmit?: (score: number) => void;
}

function KeeperSVG() {
  return (
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="28" cy="10" r="8" fill="#E8B87A" stroke="#C4935A" strokeWidth="1" />
      {/* Hair */}
      <path d="M20 8 C20 3, 36 3, 36 8" fill="#4A3520" />
      {/* Jersey */}
      <rect x="16" y="18" width="24" height="22" rx="3" fill="#FF8F00" />
      <rect x="16" y="18" width="24" height="22" rx="3" fill="url(#jerseyGrad)" />
      {/* Jersey number */}
      <text x="28" y="33" textAnchor="middle" fill="rgba(0,0,0,0.12)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">1</text>
      {/* Left arm */}
      <rect x="2" y="19" width="14" height="6" rx="3" fill="#FF8F00" />
      {/* Left glove */}
      <rect x="0" y="17" width="7" height="10" rx="2" fill="#4CAF50" />
      {/* Right arm */}
      <rect x="40" y="19" width="14" height="6" rx="3" fill="#FF8F00" />
      {/* Right glove */}
      <rect x="49" y="17" width="7" height="10" rx="2" fill="#4CAF50" />
      {/* Shorts */}
      <rect x="18" y="38" width="9" height="10" rx="2" fill="#1a1a2e" />
      <rect x="29" y="38" width="9" height="10" rx="2" fill="#1a1a2e" />
      {/* Left leg */}
      <rect x="19" y="47" width="7" height="14" rx="2" fill="#E8B87A" />
      {/* Right leg */}
      <rect x="30" y="47" width="7" height="14" rx="2" fill="#E8B87A" />
      {/* Left sock */}
      <rect x="19" y="54" width="7" height="7" rx="1" fill="#FF8F00" />
      {/* Right sock */}
      <rect x="30" y="54" width="7" height="7" rx="1" fill="#FF8F00" />
      {/* Left boot */}
      <rect x="17" y="60" width="10" height="5" rx="2" fill="#222" />
      {/* Right boot */}
      <rect x="29" y="60" width="10" height="5" rx="2" fill="#222" />
      <defs>
        <linearGradient id="jerseyGrad" x1="16" y1="18" x2="16" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.15)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.1)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function PenaltyKick({ onClose, onScoreSubmit }: PenaltyKickProps) {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [shotZone, setShotZone] = useState<Zone | null>(null);
  const [keeperZone, setKeeperZone] = useState<Zone | null>(null);
  const [isGoal, setIsGoal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);

  const streakRef = useRef(streak);
  streakRef.current = streak;

  const [confettiPieces, setConfettiPieces] = useState<Array<{
    left: number; top: number; size: number; dx: number; dy: number; dr: number; duration: number; delay: number;
  }>>([]);

  useEffect(() => {
    if (showConfetti) {
      setConfettiPieces(Array.from({ length: 20 }, () => ({
        left: 25 + Math.random() * 50,
        top: 10 + Math.random() * 30,
        size: 4 + Math.random() * 5,
        dx: (Math.random() - 0.5) * 120,
        dy: 30 + Math.random() * 80,
        dr: Math.random() * 360,
        duration: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.15,
      })));
    }
  }, [showConfetti]);

  useEffect(() => {
    setHighScore(getHighScore());
  }, []);

  const shoot = useCallback((zone: Zone) => {
    if (gameState !== "ready") return;

    const keeper = ALL_ZONES[Math.floor(Math.random() * 6)];
    const goal = zone !== keeper;

    setShotZone(zone);
    setKeeperZone(keeper);
    setGameState("kicking");

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

        setTimeout(() => {
          setShotZone(null);
          setKeeperZone(null);
          setGameState("ready");
          setHoveredZone(null);
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
    setShotZone(null);
    setKeeperZone(null);
    setIsGoal(false);
    setShowConfetti(false);
    setHoveredZone(null);
  }, []);

  const keeperAnimClass = keeperZone !== null ? `animate-keeper-z${keeperZone}` : "";
  const ballAnimClass = shotZone !== null ? `animate-ball-z${shotZone}` : "";

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <style>{`
        /* Keeper: 6 dive animations */
        @keyframes k-z0 { 0%{transform:translate(0,0) rotate(0)} 35%{transform:translate(-35px,-15px) rotate(-15deg)} 100%{transform:translate(-105px,-35px) rotate(-65deg)} }
        @keyframes k-z1 { 0%{transform:translate(0,0) scale(1)} 45%{transform:translate(0,-30px) scaleY(1.12)} 100%{transform:translate(0,-25px) scaleY(1.1) scaleX(1.15)} }
        @keyframes k-z2 { 0%{transform:translate(0,0) rotate(0)} 35%{transform:translate(35px,-15px) rotate(15deg)} 100%{transform:translate(105px,-35px) rotate(65deg)} }
        @keyframes k-z3 { 0%{transform:translate(0,0) rotate(0)} 35%{transform:translate(-30px,5px) rotate(-15deg)} 100%{transform:translate(-105px,15px) rotate(-70deg)} }
        @keyframes k-z4 { 0%{transform:translate(0,0) scale(1)} 45%{transform:translate(0,8px) scaleX(1.2)} 100%{transform:translate(0,5px) scaleX(1.25) scaleY(0.9)} }
        @keyframes k-z5 { 0%{transform:translate(0,0) rotate(0)} 35%{transform:translate(30px,5px) rotate(15deg)} 100%{transform:translate(105px,15px) rotate(70deg)} }
        .animate-keeper-z0 { animation: k-z0 0.5s cubic-bezier(0.25,0.1,0.6,1) forwards; }
        .animate-keeper-z1 { animation: k-z1 0.45s cubic-bezier(0.2,0.8,0.3,1) forwards; }
        .animate-keeper-z2 { animation: k-z2 0.5s cubic-bezier(0.25,0.1,0.6,1) forwards; }
        .animate-keeper-z3 { animation: k-z3 0.5s cubic-bezier(0.25,0.1,0.6,1) forwards; }
        .animate-keeper-z4 { animation: k-z4 0.45s cubic-bezier(0.2,0.8,0.3,1) forwards; }
        .animate-keeper-z5 { animation: k-z5 0.5s cubic-bezier(0.25,0.1,0.6,1) forwards; }

        /* Ball: 6 flight animations */
        @keyframes b-z0 { 0%{transform:translate(0,0) scale(1) rotate(0)} 50%{transform:translate(-55px,-100px) scale(0.8) rotate(270deg)} 100%{transform:translate(-110px,-180px) scale(0.6) rotate(540deg)} }
        @keyframes b-z1 { 0%{transform:translate(0,0) scale(1) rotate(0)} 50%{transform:translate(0,-110px) scale(0.8) rotate(270deg)} 100%{transform:translate(0,-195px) scale(0.6) rotate(540deg)} }
        @keyframes b-z2 { 0%{transform:translate(0,0) scale(1) rotate(0)} 50%{transform:translate(55px,-100px) scale(0.8) rotate(270deg)} 100%{transform:translate(110px,-180px) scale(0.6) rotate(540deg)} }
        @keyframes b-z3 { 0%{transform:translate(0,0) scale(1) rotate(0)} 50%{transform:translate(-50px,-75px) scale(0.85) rotate(270deg)} 100%{transform:translate(-100px,-130px) scale(0.7) rotate(540deg)} }
        @keyframes b-z4 { 0%{transform:translate(0,0) scale(1) rotate(0)} 50%{transform:translate(0,-80px) scale(0.85) rotate(270deg)} 100%{transform:translate(0,-140px) scale(0.7) rotate(540deg)} }
        @keyframes b-z5 { 0%{transform:translate(0,0) scale(1) rotate(0)} 50%{transform:translate(50px,-75px) scale(0.85) rotate(270deg)} 100%{transform:translate(100px,-130px) scale(0.7) rotate(540deg)} }
        .animate-ball-z0 { animation: b-z0 0.55s cubic-bezier(0.1,0.6,0.3,1) forwards; }
        .animate-ball-z1 { animation: b-z1 0.55s cubic-bezier(0.1,0.6,0.3,1) forwards; }
        .animate-ball-z2 { animation: b-z2 0.55s cubic-bezier(0.1,0.6,0.3,1) forwards; }
        .animate-ball-z3 { animation: b-z3 0.55s cubic-bezier(0.1,0.6,0.3,1) forwards; }
        .animate-ball-z4 { animation: b-z4 0.55s cubic-bezier(0.1,0.6,0.3,1) forwards; }
        .animate-ball-z5 { animation: b-z5 0.55s cubic-bezier(0.1,0.6,0.3,1) forwards; }

        @keyframes result-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confetti-pop {
          0% { transform: translate(0,0) rotate(0) scale(1); opacity:1; }
          100% { transform: translate(var(--dx),var(--dy)) rotate(var(--dr)) scale(0); opacity:0; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-white uppercase tracking-wide">Penalty Kicks</span>
          {highScore > 0 && (
            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">Best: {highScore}</span>
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

      {/* Pitch */}
      <div
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{
          aspectRatio: "16 / 10",
          background: "linear-gradient(180deg, #0e2b0e 0%, #1a6b1f 35%, #1B5E20 100%)",
        }}
      >
        {/* Grass stripes */}
        {[0,1,2,3,4,5,6,7].map(i => (
          <div key={i} className="absolute w-full pointer-events-none" style={{
            top: `${i*12.5}%`, height: "6.25%",
            background: i%2===0 ? "rgba(255,255,255,0.02)" : "transparent",
          }} />
        ))}

        {/* Goal */}
        <div className="absolute" style={{ left: "15%", right: "15%", top: "8%", height: "45%" }}>
          {/* Net */}
          <div className="absolute inset-0" style={{
            background: "rgba(0,0,0,0.45)",
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }} />

          {/* Posts + crossbar */}
          <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ background: "linear-gradient(90deg, #ccc, #fff 50%, #aaa)", boxShadow: "2px 0 6px rgba(0,0,0,0.4)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-[5px]" style={{ background: "linear-gradient(90deg, #aaa, #fff 50%, #ccc)", boxShadow: "-2px 0 6px rgba(0,0,0,0.4)" }} />
          <div className="absolute left-0 right-0 top-0 h-[5px]" style={{ background: "linear-gradient(180deg, #ddd, #fff 50%, #aaa)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />

          {/* === CLICKABLE ZONES (3x2 grid on the goal) === */}
          {gameState === "ready" && (
            <div className="absolute inset-[5px] grid grid-cols-3 grid-rows-2 gap-0" style={{ zIndex: 10 }}>
              {(ALL_ZONES).map((zone) => (
                <button
                  key={zone}
                  className="relative w-full h-full cursor-crosshair"
                  onClick={() => shoot(zone)}
                  onMouseEnter={() => setHoveredZone(zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                  aria-label={`Shoot ${ZONE_NAMES[zone]}`}
                  style={{
                    background: hoveredZone === zone ? "rgba(0, 230, 118, 0.15)" : "transparent",
                    borderLeft: zone % 3 !== 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    borderTop: zone >= 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    transition: "background 0.15s ease",
                  }}
                >
                  {hoveredZone === zone && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div style={{
                        width: "28px", height: "28px",
                        borderRadius: "50%",
                        border: "2px solid rgba(0, 230, 118, 0.7)",
                        background: "rgba(0, 230, 118, 0.1)",
                        boxShadow: "0 0 16px rgba(0, 230, 118, 0.2)",
                      }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-accent/80" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* === KEEPER === */}
          <div
            className={keeperAnimClass}
            style={{
              position: "absolute",
              left: "50%",
              bottom: "2px",
              marginLeft: "-28px",
              zIndex: 5,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          >
            <KeeperSVG />
          </div>
        </div>

        {/* Penalty box */}
        <div className="absolute pointer-events-none" style={{
          left: "22%", right: "22%", top: "53%", bottom: "15%",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }} />

        {/* Penalty spot */}
        <div className="absolute rounded-full pointer-events-none" style={{
          left: "50%", bottom: "22%", width: "5px", height: "5px", marginLeft: "-2.5px",
          background: "rgba(255,255,255,0.35)",
        }} />

        {/* === BALL === */}
        <div
          className={`absolute pointer-events-none ${ballAnimClass}`}
          style={{
            left: "50%", bottom: "20%", marginLeft: "-18px",
            zIndex: 8, fontSize: "36px", lineHeight: 1,
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))",
          }}
        >
          ⚽
        </div>

        {/* Confetti */}
        {showConfetti && confettiPieces.map((piece, i) => (
          <div key={i} className="absolute pointer-events-none" style={{
            left: `${piece.left}%`, top: `${piece.top}%`,
            width: `${piece.size}px`, height: `${piece.size}px`,
            borderRadius: i%3===0 ? "50%" : "1px",
            background: ["#00E676","#FFD700","#fff","#4CAF50","#FF5722","#2196F3"][i%6],
            ["--dx" as string]: `${piece.dx}px`,
            ["--dy" as string]: `${piece.dy}px`,
            ["--dr" as string]: `${piece.dr}deg`,
            animation: `confetti-pop ${piece.duration}s ${piece.delay}s ease-out forwards`,
          }} />
        ))}

        {/* Result overlay */}
        {gameState === "result" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 20 }}>
            <span
              className="font-heading text-5xl md:text-6xl font-black uppercase tracking-wider px-5 py-2 rounded-lg"
              style={{
                color: isGoal ? "#00E676" : "#EF4444",
                background: "rgba(10,22,40,0.88)",
                border: `2px solid ${isGoal ? "rgba(0,230,118,0.3)" : "rgba(239,68,68,0.3)"}`,
                animation: "result-pop 0.35s ease-out forwards",
                textShadow: isGoal ? "0 0 25px rgba(0,230,118,0.4)" : "0 0 25px rgba(239,68,68,0.3)",
              }}
            >
              {isGoal ? "GOAL!" : "SAVED!"}
            </span>
          </div>
        )}

        {/* Hint */}
        {gameState === "ready" && streak === 0 && (
          <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none" style={{ zIndex: 15 }}>
            <span className="inline-block bg-navy/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-300">
              Click where you want to shoot
            </span>
          </div>
        )}
      </div>

      {/* Kick info */}
      {(gameState === "kicking" || gameState === "result") && shotZone !== null && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            You kicked {shotZone !== null ? ZONE_NAMES[shotZone] : ""}{keeperZone !== null ? `, keeper dove ${ZONE_NAMES[keeperZone]}` : ""}
          </p>
        </div>
      )}

      {/* Difficulty */}
      {gameState === "ready" && streak > 0 && (
        <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Streak: {streak}</p>
        </div>
      )}

      {/* Game Over */}
      {gameState === "gameover" && (
        <div className="mt-4 text-center">
          <p className="font-heading text-xl font-bold text-white mb-1">Game Over!</p>
          <p className="text-gray-400 text-sm mb-1">
            {streak === 0 ? "Better luck next time!" : `You scored ${streak} goal${streak === 1 ? "" : "s"} in a row!`}
          </p>
          <p className="text-xs text-gray-500 mb-4">You kicked {shotZone !== null ? ZONE_NAMES[shotZone] : ""}, keeper dove {keeperZone !== null ? ZONE_NAMES[keeperZone] : ""}</p>
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
