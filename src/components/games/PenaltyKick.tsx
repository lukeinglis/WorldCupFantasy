"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GameState = "aiming" | "shooting" | "result" | "gameover";
type ShotZone = 0 | 1 | 2 | 3 | 4 | 5;

// Zone labels for keeper dive targeting
const ZONE_LABELS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

// Keeper coverage increases with streak: 1 zone at 0-2, up to 4 at 9+
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

// Ball end position for each zone (px offsets from penalty spot).
// Ball starts at left:50%, top:82%. Goal spans top:6%-44%, left:15%-85%.
// To reach mid-goal (~25% of container = ~112px on 450px), ball must move ~257px up.
// Goal width is 70% of container = ~420px on 600px. Half is ~210px.
const BALL_ZONE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: -130, y: -270 }, // top-left
  1: { x: 0, y: -285 },    // top-center
  2: { x: 130, y: -270 },  // top-right
  3: { x: -120, y: -200 }, // bottom-left
  4: { x: 0, y: -190 },    // bottom-center
  5: { x: 120, y: -200 },  // bottom-right
};

// Keeper dive positions (px offsets from standing center in goal).
// Keeper stands at left:50%, bottom:0 inside goal div.
// Goal div is ~420px wide, so diving to left/right post = ~180px.
const KEEPER_DIVE_POSITIONS: Record<number, { x: number; y: number; rotate: number }> = {
  0: { x: -160, y: -70, rotate: -55 },  // top-left: big lateral dive + up
  1: { x: 0, y: -80, rotate: 0 },       // top-center: jump up
  2: { x: 160, y: -70, rotate: 55 },    // top-right: big lateral dive + up
  3: { x: -150, y: 10, rotate: -70 },   // bottom-left: low dive
  4: { x: 0, y: 15, rotate: 0 },        // bottom-center: drop down
  5: { x: 150, y: 10, rotate: 70 },     // bottom-right: low dive
};

interface Confetto {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
}

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

  // Animation state
  const [ballAnimating, setBallAnimating] = useState(false);
  const [ballTarget, setBallTarget] = useState<number | null>(null);
  const [keeperDiving, setKeeperDiving] = useState(false);
  const [keeperTarget, setKeeperTarget] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<Confetto[]>([]);
  const [ballWiggle, setBallWiggle] = useState(false);

  // Ref to track current streak for timeout callbacks
  const streakRef = useRef(streak);
  streakRef.current = streak;

  useEffect(() => {
    setHighScoreState(getHighScore());
  }, []);

  const spawnConfetti = useCallback(() => {
    const colors = ["#00E676", "#FFD700", "#ffffff", "#4CAF50", "#FFEB3B", "#FF5722", "#2196F3"];
    const pieces: Confetto[] = [];
    for (let i = 0; i < 30; i++) {
      pieces.push({
        id: i,
        x: 40 + Math.random() * 20,
        y: 10 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.8,
        rotate: Math.random() * 720 - 360,
        size: 4 + Math.random() * 6,
      });
    }
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2500);
  }, []);

  const shoot = useCallback(
    (zone: ShotZone) => {
      if (gameState !== "aiming") return;
      setGameState("shooting");
      setHoveredZone(null);

      const saveZones = getKeeperSaveZones(streak);
      const saved = saveZones.includes(zone);

      // Keeper dives to ball zone if saving, otherwise to first save zone
      const keeperDiveZone = saved ? zone : saveZones[0];

      // Step 1: Ball wiggle anticipation
      setBallWiggle(true);

      setTimeout(() => {
        setBallWiggle(false);

        // Step 2: Kick the ball
        setBallTarget(zone);
        setBallAnimating(true);

        // Step 3: Keeper dives (slightly delayed)
        setTimeout(() => {
          setKeeperTarget(keeperDiveZone);
          setKeeperDiving(true);
        }, 50);

        // Step 4: Show result after ball arrives
        setTimeout(() => {
          setGameState("result");

          if (saved) {
            setResultText("SAVED!");
            setIsGoal(false);

            setTimeout(() => {
              const currentStreak = streakRef.current;
              if (currentStreak > 0 && onScoreSubmit) {
                onScoreSubmit(currentStreak);
              }
              setGameState("gameover");
            }, 1500);
          } else {
            setResultText("GOAL!");
            setIsGoal(true);
            spawnConfetti();

            setStreak((prev) => {
              const newStreak = prev + 1;
              if (newStreak > getHighScore()) {
                setHighScoreState(newStreak);
                setHighScore(newStreak);
              }
              return newStreak;
            });

            // Reset for next kick
            setTimeout(() => {
              setBallAnimating(false);
              setBallTarget(null);
              setKeeperDiving(false);
              setKeeperTarget(null);
              setResultText("");
              setGameState("aiming");
            }, 1500);
          }
        }, 500);
      }, 200);
    },
    [gameState, streak, spawnConfetti, onScoreSubmit]
  );

  const resetGame = useCallback(() => {
    setStreak(0);
    setGameState("aiming");
    setResultText("");
    setIsGoal(false);
    setHoveredZone(null);
    setBallAnimating(false);
    setBallTarget(null);
    setKeeperDiving(false);
    setKeeperTarget(null);
    setConfetti([]);
    setBallWiggle(false);
  }, []);

  // Compute ball transform
  const ballPos = ballTarget !== null ? BALL_ZONE_POSITIONS[ballTarget] : null;
  const ballStyle: React.CSSProperties = ballAnimating && ballPos
    ? {
        transform: `translate(${ballPos.x}px, ${ballPos.y}px) scale(0.7) rotate(720deg)`,
        transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.3, 1)",
      }
    : ballWiggle
      ? {
          transform: "translate(0, 0) scale(1) rotate(0deg)",
          animation: "ball-wiggle 0.2s ease-in-out",
        }
      : {
          transform: "translate(0, 0) scale(1) rotate(0deg)",
          transition: "transform 0.3s ease-out",
        };

  // Compute keeper transform
  const keeperPos = keeperTarget !== null ? KEEPER_DIVE_POSITIONS[keeperTarget] : null;
  const isDivingLateral = keeperPos && Math.abs(keeperPos.x) > 50;
  const keeperStyle: React.CSSProperties = keeperDiving && keeperPos
    ? {
        transform: `translate(${keeperPos.x}px, ${keeperPos.y}px) rotate(${keeperPos.rotate}deg) ${isDivingLateral ? "scaleX(1.4) scaleY(0.85)" : ""}`,
        transition: "transform 0.42s cubic-bezier(0.2, 0.7, 0.3, 1)",
      }
    : {
        transform: "translate(0, 0) rotate(0deg) scaleX(1) scaleY(1)",
        transition: "transform 0.3s ease-out",
      };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Keyframe animations */}
      <style>{`
        @keyframes ball-wiggle {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-3px, -1px) rotate(-3deg); }
          50% { transform: translate(2px, 0px) rotate(2deg); }
          75% { transform: translate(-2px, 1px) rotate(-2deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes confetto-fall {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--cx), 80px) rotate(var(--cr)) scale(0.3); }
        }
        @keyframes goal-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(0,230,118,0.5); }
          50% { text-shadow: 0 0 40px rgba(0,230,118,0.8), 0 0 60px rgba(0,230,118,0.3); }
        }
        @keyframes saved-pulse {
          0%, 100% { text-shadow: 0 0 15px rgba(239,68,68,0.4); }
          50% { text-shadow: 0 0 30px rgba(239,68,68,0.7); }
        }
        @keyframes net-shimmer {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.1; }
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
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-sm"
          aria-label="Close game"
        >
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
          <div className="text-center">
            <p className="text-xs text-gold font-bold animate-pulse">
              {streak >= 9 ? "LEGENDARY!" : streak >= 6 ? "ON FIRE!" : "HOT STREAK!"}
            </p>
          </div>
        )}
      </div>

      {/* Game Area */}
      <div
        className="relative rounded-xl overflow-hidden border border-white/10 select-none"
        style={{
          width: "100%",
          aspectRatio: "600 / 450",
          background: "linear-gradient(180deg, #0f2e0f 0%, #1B5E20 30%, #1a6b1f 60%, #145216 100%)",
        }}
      >
        {/* Grass stripes */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.025 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{
                top: `${i * 8.33}%`,
                height: "4.16%",
                background: i % 2 === 0 ? "white" : "transparent",
              }}
            />
          ))}
        </div>

        {/* 18-yard box lines */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "12%",
            right: "12%",
            top: "40%",
            bottom: "32%",
            border: "1.5px solid rgba(255,255,255,0.10)",
            borderTop: "none",
          }}
        />

        {/* 6-yard box lines */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "30%",
            right: "30%",
            top: "44%",
            bottom: "48%",
            border: "1.5px solid rgba(255,255,255,0.15)",
            borderTop: "none",
          }}
        />

        {/* Penalty arc */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "82%",
            width: "90px",
            height: "90px",
            marginLeft: "-45px",
            marginTop: "-45px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
          }}
        />

        {/* Penalty spot */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: "50%",
            top: "82%",
            width: "6px",
            height: "6px",
            marginLeft: "-3px",
            marginTop: "-3px",
            background: "rgba(255,255,255,0.45)",
          }}
        />

        {/* ========== GOAL ========== */}
        <div
          className="absolute"
          style={{
            left: "15%",
            right: "15%",
            top: "6%",
            bottom: "56%",
          }}
        >
          {/* Net background */}
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.55)",
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "14px 14px",
            }}
          />

          {/* Net diagonal overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 19px,
                  rgba(255,255,255,0.03) 19px,
                  rgba(255,255,255,0.03) 20px
                )
              `,
              animation: "net-shimmer 4s ease-in-out infinite",
            }}
          />

          {/* Left post */}
          <div
            className="absolute"
            style={{
              left: "-6px",
              top: "-6px",
              width: "6px",
              bottom: "0",
              background: "linear-gradient(90deg, #e0e0e0, #ffffff 50%, #d0d0d0)",
              borderRadius: "2px 0 0 2px",
              boxShadow: "-2px 2px 4px rgba(0,0,0,0.3)",
            }}
          />

          {/* Right post */}
          <div
            className="absolute"
            style={{
              right: "-6px",
              top: "-6px",
              width: "6px",
              bottom: "0",
              background: "linear-gradient(90deg, #d0d0d0, #ffffff 50%, #e0e0e0)",
              borderRadius: "0 2px 2px 0",
              boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          />

          {/* Crossbar */}
          <div
            className="absolute"
            style={{
              left: "-6px",
              right: "-6px",
              top: "-6px",
              height: "6px",
              background: "linear-gradient(180deg, #e0e0e0, #ffffff 50%, #d0d0d0)",
              borderRadius: "2px 2px 0 0",
              boxShadow: "0 -2px 4px rgba(0,0,0,0.3)",
            }}
          />

          {/* ========== CLICKABLE ZONES (3x2 grid) ========== */}
          {gameState === "aiming" && (
            <div
              className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0"
              style={{ zIndex: 10 }}
            >
              {[0, 1, 2, 3, 4, 5].map((zone) => (
                <button
                  key={zone}
                  className="relative w-full h-full cursor-crosshair group"
                  onClick={() => shoot(zone as ShotZone)}
                  onMouseEnter={() => setHoveredZone(zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                  aria-label={`Shoot ${ZONE_LABELS[zone]}`}
                >
                  {/* Hover highlight */}
                  <div
                    className="absolute inset-1 rounded transition-all duration-150"
                    style={{
                      background:
                        hoveredZone === zone
                          ? "rgba(0, 230, 118, 0.18)"
                          : "transparent",
                      border:
                        hoveredZone === zone
                          ? "2px solid rgba(0, 230, 118, 0.7)"
                          : "1px dashed rgba(255,255,255,0.12)",
                      boxShadow:
                        hoveredZone === zone
                          ? "inset 0 0 20px rgba(0,230,118,0.1)"
                          : "none",
                    }}
                  />
                  {/* Crosshair dot */}
                  <div
                    className="absolute top-1/2 left-1/2 rounded-full transition-all duration-150"
                    style={{
                      width: hoveredZone === zone ? "6px" : "4px",
                      height: hoveredZone === zone ? "6px" : "4px",
                      marginLeft: hoveredZone === zone ? "-3px" : "-2px",
                      marginTop: hoveredZone === zone ? "-3px" : "-2px",
                      background:
                        hoveredZone === zone
                          ? "rgba(0, 230, 118, 0.9)"
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                  {/* Crosshair lines on hover */}
                  {hoveredZone === zone && (
                    <>
                      <div
                        className="absolute top-1/2 left-1/2"
                        style={{
                          width: "20px",
                          height: "2px",
                          marginLeft: "-10px",
                          marginTop: "-1px",
                          background: "rgba(0, 230, 118, 0.7)",
                          maskImage: "linear-gradient(90deg, transparent 0%, transparent 35%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, transparent 65%, transparent 100%)",
                          WebkitMaskImage: "linear-gradient(90deg, rgba(0,230,118,1) 0%, rgba(0,230,118,1) 30%, transparent 40%, transparent 60%, rgba(0,230,118,1) 70%, rgba(0,230,118,1) 100%)",
                        }}
                      />
                      <div
                        className="absolute top-1/2 left-1/2"
                        style={{
                          width: "2px",
                          height: "20px",
                          marginLeft: "-1px",
                          marginTop: "-10px",
                          background: "rgba(0, 230, 118, 0.7)",
                          WebkitMaskImage: "linear-gradient(180deg, rgba(0,230,118,1) 0%, rgba(0,230,118,1) 30%, transparent 40%, transparent 60%, rgba(0,230,118,1) 70%, rgba(0,230,118,1) 100%)",
                        }}
                      />
                    </>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ========== KEEPER ========== */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              bottom: "0",
              marginLeft: "-20px",
              zIndex: 5,
              ...keeperStyle,
            }}
          >
            {/* Keeper body */}
            <div className="relative" style={{ width: "40px", height: "60px" }}>
              {/* Head */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "0",
                  left: "50%",
                  marginLeft: "-8px",
                  width: "16px",
                  height: "16px",
                  background: "radial-gradient(circle at 40% 35%, #FFCC80, #E0A050)",
                  boxShadow: "0 -2px 0 2px #5D4037, inset 0 -1px 2px rgba(0,0,0,0.1)",
                }}
              />

              {/* Jersey/torso */}
              <div
                className="absolute"
                style={{
                  top: "14px",
                  left: "4px",
                  right: "4px",
                  height: "26px",
                  background: "linear-gradient(180deg, #FFA726 0%, #FF8F00 50%, #FF6F00 100%)",
                  borderRadius: "3px 3px 2px 2px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {/* Jersey number */}
                <span
                  className="absolute top-1/2 left-1/2 font-bold text-xs"
                  style={{
                    transform: "translate(-50%, -50%)",
                    color: "rgba(0,0,0,0.15)",
                    fontSize: "11px",
                  }}
                >
                  1
                </span>
              </div>

              {/* Left arm */}
              <div
                className="absolute"
                style={{
                  top: "16px",
                  left: "-8px",
                  width: "12px",
                  height: "5px",
                  background: "#FF8F00",
                  borderRadius: "3px",
                  transform: "rotate(-15deg)",
                  transformOrigin: "right center",
                }}
              >
                {/* Glove */}
                <div
                  className="absolute rounded"
                  style={{
                    left: "-4px",
                    top: "-1px",
                    width: "7px",
                    height: "7px",
                    background: "#66BB6A",
                  }}
                />
              </div>

              {/* Right arm */}
              <div
                className="absolute"
                style={{
                  top: "16px",
                  right: "-8px",
                  width: "12px",
                  height: "5px",
                  background: "#FF8F00",
                  borderRadius: "3px",
                  transform: "rotate(15deg)",
                  transformOrigin: "left center",
                }}
              >
                {/* Glove */}
                <div
                  className="absolute rounded"
                  style={{
                    right: "-4px",
                    top: "-1px",
                    width: "7px",
                    height: "7px",
                    background: "#66BB6A",
                  }}
                />
              </div>

              {/* Shorts */}
              <div
                className="absolute"
                style={{
                  top: "38px",
                  left: "6px",
                  right: "6px",
                  height: "10px",
                  background: "#1a1a2e",
                  borderRadius: "0 0 2px 2px",
                }}
              />

              {/* Left leg */}
              <div
                className="absolute"
                style={{
                  top: "46px",
                  left: "8px",
                  width: "5px",
                  height: "12px",
                  background: "#1a1a2e",
                  borderRadius: "0 0 2px 2px",
                }}
              >
                {/* Boot */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    bottom: "-3px",
                    left: "-1px",
                    width: "8px",
                    height: "4px",
                    background: "#111",
                  }}
                />
              </div>

              {/* Right leg */}
              <div
                className="absolute"
                style={{
                  top: "46px",
                  right: "8px",
                  width: "5px",
                  height: "12px",
                  background: "#1a1a2e",
                  borderRadius: "0 0 2px 2px",
                }}
              >
                {/* Boot */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    bottom: "-3px",
                    right: "-1px",
                    width: "8px",
                    height: "4px",
                    background: "#111",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========== BALL ========== */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "82%",
            marginLeft: "-15px",
            marginTop: "-15px",
            zIndex: 8,
            ...ballStyle,
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              fontSize: "28px",
              lineHeight: "30px",
              textAlign: "center",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
            }}
          >
            ⚽
          </div>
        </div>

        {/* ========== CONFETTI ========== */}
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute pointer-events-none"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.size}px`,
              height: `${c.size}px`,
              background: c.color,
              borderRadius: c.id % 3 === 0 ? "50%" : "1px",
              ["--cx" as string]: `${(Math.random() - 0.5) * 60}px`,
              ["--cr" as string]: `${c.rotate}deg`,
              animation: `confetto-fall ${c.duration}s ${c.delay}s ease-out forwards`,
              opacity: 0,
              animationFillMode: "forwards",
            }}
          />
        ))}

        {/* ========== RESULT TEXT ========== */}
        {resultText && (
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{ paddingBottom: "8px", zIndex: 20 }}
          >
            <span
              className="font-heading text-4xl md:text-5xl font-extrabold uppercase tracking-wider px-4 py-1 rounded-lg"
              style={{
                color: isGoal ? "#00E676" : "#EF4444",
                background: "rgba(10, 22, 40, 0.85)",
                backdropFilter: "blur(4px)",
                animation: isGoal ? "goal-pulse 0.6s ease-in-out infinite" : "saved-pulse 0.8s ease-in-out infinite",
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
          <span className="text-xs text-gray-500">Keeper difficulty:</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-1.5 rounded-full ${
                  i < Math.min(4, 1 + Math.floor(streak / 3))
                    ? "bg-accent"
                    : "bg-white/10"
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
