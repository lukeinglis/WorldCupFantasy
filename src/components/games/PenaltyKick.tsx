"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type GameState = "aiming" | "shooting" | "result" | "gameover";
type ShotZone = 0 | 1 | 2 | 3 | 4 | 5; // 6 zones: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right

interface AnimationState {
  ballX: number;
  ballY: number;
  ballSize: number;
  keeperX: number;
  keeperDiveDirection: number; // -1 left, 0 center, 1 right
  keeperDiveProgress: number;
  opacity: number;
}

const ZONE_LABELS = ["Top Left", "Top Center", "Top Right", "Bottom Left", "Bottom Center", "Bottom Right"];

// Zone positions relative to goal (x%, y%)
const ZONE_POSITIONS: { x: number; y: number }[] = [
  { x: 0.2, y: 0.3 },  // top-left
  { x: 0.5, y: 0.25 }, // top-center
  { x: 0.8, y: 0.3 },  // top-right
  { x: 0.2, y: 0.7 },  // bottom-left
  { x: 0.5, y: 0.75 }, // bottom-center
  { x: 0.8, y: 0.7 },  // bottom-right
];

function getKeeperSaveZones(streak: number): number[] {
  // As streak grows, keeper covers more zones
  // Streak 0-2: covers 1 zone (random)
  // Streak 3-5: covers 2 zones
  // Streak 6-8: covers 3 zones
  // Streak 9+: covers 4 zones (tough but beatable)
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

export default function PenaltyKick({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>("aiming");
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [resultText, setResultText] = useState("");
  const [isGoal, setIsGoal] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);

  const animStateRef = useRef<AnimationState>({
    ballX: 0.5,
    ballY: 0.9,
    ballSize: 18,
    keeperX: 0.5,
    keeperDiveDirection: 0,
    keeperDiveProgress: 0,
    opacity: 1,
  });

  useEffect(() => {
    setHighScoreState(getHighScore());
  }, []);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const anim = animStateRef.current;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Sky / pitch gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#1a2a1a");
    bgGrad.addColorStop(0.4, "#1B5E20");
    bgGrad.addColorStop(1, "#0D3B0F");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Pitch lines
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    // Penalty box
    const boxLeft = W * 0.15;
    const boxRight = W * 0.85;
    const boxTop = H * 0.1;
    const boxBottom = H * 0.75;
    ctx.strokeRect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);

    // Goal frame
    const goalLeft = W * 0.2;
    const goalRight = W * 0.8;
    const goalTop = H * 0.08;
    const goalBottom = H * 0.55;

    // Goal net (subtle grid)
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    const netSpacing = 12;
    for (let x = goalLeft; x <= goalRight; x += netSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, goalTop);
      ctx.lineTo(x, goalBottom);
      ctx.stroke();
    }
    for (let y = goalTop; y <= goalBottom; y += netSpacing) {
      ctx.beginPath();
      ctx.moveTo(goalLeft, y);
      ctx.lineTo(goalRight, y);
      ctx.stroke();
    }

    // Goal back (dark)
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(goalLeft, goalTop, goalRight - goalLeft, goalBottom - goalTop);

    // Goal posts (white bars)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(goalLeft - 4, goalTop - 4, 6, goalBottom - goalTop + 8); // left post
    ctx.fillRect(goalRight - 2, goalTop - 4, 6, goalBottom - goalTop + 8); // right post
    ctx.fillRect(goalLeft - 4, goalTop - 4, goalRight - goalLeft + 8, 6); // crossbar

    // Zone hover highlights (only in aiming state)
    if (gameState === "aiming") {
      for (let i = 0; i < 6; i++) {
        const zp = ZONE_POSITIONS[i];
        const zx = goalLeft + (goalRight - goalLeft) * zp.x;
        const zy = goalTop + (goalBottom - goalTop) * zp.y;
        const zoneW = (goalRight - goalLeft) / 3.5;
        const zoneH = (goalBottom - goalTop) / 3;

        if (hoveredZone === i) {
          ctx.fillStyle = "rgba(0, 230, 118, 0.25)";
          ctx.beginPath();
          ctx.roundRect(zx - zoneW / 2, zy - zoneH / 2, zoneW, zoneH, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 230, 118, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.beginPath();
          ctx.roundRect(zx - zoneW / 2, zy - zoneH / 2, zoneW, zoneH, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Zone crosshair dot
        ctx.fillStyle = hoveredZone === i ? "rgba(0, 230, 118, 0.8)" : "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(zx, zy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Keeper
    const keeperBaseX = goalLeft + (goalRight - goalLeft) * anim.keeperX;
    const keeperY = goalBottom - 10;
    const keeperW = 30;
    const keeperH = 60;
    const diveOffset = anim.keeperDiveDirection * anim.keeperDiveProgress * 80;
    const diveStretch = anim.keeperDiveProgress * 20;

    // Keeper body
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.roundRect(
      keeperBaseX - keeperW / 2 + diveOffset - diveStretch / 2,
      keeperY - keeperH + Math.abs(anim.keeperDiveProgress * 15),
      keeperW + diveStretch,
      keeperH - Math.abs(anim.keeperDiveProgress * 15),
      4
    );
    ctx.fill();

    // Keeper head
    ctx.fillStyle = "#FFCC80";
    ctx.beginPath();
    ctx.arc(
      keeperBaseX + diveOffset,
      keeperY - keeperH - 5 + Math.abs(anim.keeperDiveProgress * 15),
      10,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Keeper arms (stretched during dive)
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const armBaseX = keeperBaseX + diveOffset;
    const armBaseY = keeperY - keeperH + 15 + Math.abs(anim.keeperDiveProgress * 15);

    // Left arm
    ctx.beginPath();
    ctx.moveTo(armBaseX - keeperW / 2, armBaseY);
    ctx.lineTo(
      armBaseX - keeperW / 2 - 15 - diveStretch,
      armBaseY - 20 - anim.keeperDiveProgress * 10
    );
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(armBaseX + keeperW / 2, armBaseY);
    ctx.lineTo(
      armBaseX + keeperW / 2 + 15 + diveStretch,
      armBaseY - 20 - anim.keeperDiveProgress * 10
    );
    ctx.stroke();

    // Ball
    ctx.globalAlpha = anim.opacity;
    const bx = W * anim.ballX;
    const by = H * anim.ballY;
    const bs = anim.ballSize;

    // Ball shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + bs * 0.8, bs * 0.8, bs * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const ballGrad = ctx.createRadialGradient(bx - bs * 0.2, by - bs * 0.2, bs * 0.1, bx, by, bs);
    ballGrad.addColorStop(0, "#ffffff");
    ballGrad.addColorStop(1, "#cccccc");
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(bx, by, bs, 0, Math.PI * 2);
    ctx.fill();

    // Ball pentagon pattern
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const px = bx + Math.cos(angle) * bs * 0.5;
      const py = by + Math.sin(angle) * bs * 0.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [gameState, hoveredZone]);

  // Continuous draw loop
  useEffect(() => {
    const loop = () => {
      drawGame();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawGame]);

  const getZoneFromPosition = useCallback((clientX: number, clientY: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    const W = canvas.width;
    const H = canvas.height;
    const goalLeft = 0.2;
    const goalRight = 0.8;
    const goalTop = 0.08;
    const goalBottom = 0.55;
    const goalW = goalRight - goalLeft;
    const goalH = goalBottom - goalTop;
    const zoneW = goalW / 3.5;
    const zoneH = goalH / 3;

    for (let i = 0; i < 6; i++) {
      const zp = ZONE_POSITIONS[i];
      const zx = goalLeft + goalW * zp.x;
      const zy = goalTop + goalH * zp.y;

      if (
        x >= zx - zoneW / 2 &&
        x <= zx + zoneW / 2 &&
        y >= zy - zoneH / 2 &&
        y <= zy + zoneH / 2
      ) {
        return i;
      }
    }
    return null;
  }, []);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== "aiming") return;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setHoveredZone(getZoneFromPosition(clientX, clientY));
  }, [gameState, getZoneFromPosition]);

  const shoot = useCallback((zone: ShotZone) => {
    if (gameState !== "aiming") return;
    setGameState("shooting");

    const saveZones = getKeeperSaveZones(streak);
    const saved = saveZones.includes(zone);

    // Determine keeper dive direction based on save zones
    const avgZoneX = saveZones.reduce((sum, z) => sum + ZONE_POSITIONS[z].x, 0) / (saveZones.length || 1);
    const diveDir = avgZoneX < 0.4 ? -1 : avgZoneX > 0.6 ? 1 : 0;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.width;
    const H = canvas.height;
    const goalLeft = W * 0.2;
    const goalRight = W * 0.8;
    const goalTop = H * 0.08;
    const goalBottom = H * 0.55;

    const targetX = (goalLeft + (goalRight - goalLeft) * ZONE_POSITIONS[zone].x) / W;
    const targetY = (goalTop + (goalBottom - goalTop) * ZONE_POSITIONS[zone].y) / H;

    const startBallX = 0.5;
    const startBallY = 0.9;
    const startBallSize = 18;
    const endBallSize = 10;

    let frame = 0;
    const totalFrames = 30;

    const animate = () => {
      frame++;
      const t = Math.min(frame / totalFrames, 1);
      // Ease out quad
      const ease = 1 - (1 - t) * (1 - t);

      animStateRef.current.ballX = startBallX + (targetX - startBallX) * ease;
      animStateRef.current.ballY = startBallY + (targetY - startBallY) * ease;
      animStateRef.current.ballSize = startBallSize + (endBallSize - startBallSize) * ease;

      // Keeper dive
      animStateRef.current.keeperDiveDirection = diveDir;
      animStateRef.current.keeperDiveProgress = Math.min(t * 1.5, 1);

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        // Result
        if (saved) {
          setResultText("SAVED!");
          setIsGoal(false);
          setTimeout(() => {
            setGameState("gameover");
          }, 1200);
        } else {
          setResultText("GOAL!");
          setIsGoal(true);
          const newStreak = streak + 1;
          setStreak(newStreak);
          if (newStreak > highScore) {
            setHighScoreState(newStreak);
            setHighScore(newStreak);
          }
          setTimeout(() => {
            // Reset for next kick
            animStateRef.current = {
              ballX: 0.5,
              ballY: 0.9,
              ballSize: 18,
              keeperX: 0.5,
              keeperDiveDirection: 0,
              keeperDiveProgress: 0,
              opacity: 1,
            };
            setResultText("");
            setGameState("aiming");
            setHoveredZone(null);
          }, 1000);
        }
        setGameState("result");
      }
    };

    requestAnimationFrame(animate);
  }, [gameState, streak, highScore]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== "aiming") return;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const zone = getZoneFromPosition(clientX, clientY);
    if (zone !== null) {
      shoot(zone as ShotZone);
    }
  }, [gameState, getZoneFromPosition, shoot]);

  const resetGame = useCallback(() => {
    setStreak(0);
    setGameState("aiming");
    setResultText("");
    setIsGoal(false);
    setHoveredZone(null);
    animStateRef.current = {
      ballX: 0.5,
      ballY: 0.9,
      ballSize: 18,
      keeperX: 0.5,
      keeperDiveDirection: 0,
      keeperDiveProgress: 0,
      opacity: 1,
    };
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
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

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-white/10">
        <canvas
          ref={canvasRef}
          width={400}
          height={350}
          className="w-full cursor-crosshair touch-none"
          style={{ aspectRatio: "400/350" }}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Result overlay */}
        {resultText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={`font-heading text-5xl font-extrabold uppercase tracking-wider drop-shadow-lg ${
                isGoal ? "text-accent animate-bounce" : "text-red-400"
              }`}
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
            >
              {resultText}
            </span>
          </div>
        )}

        {/* Aiming hint */}
        {gameState === "aiming" && streak === 0 && (
          <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
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
