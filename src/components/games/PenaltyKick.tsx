"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type GameState = "aiming" | "shooting" | "result" | "gameover";
type ShotZone = 0 | 1 | 2 | 3 | 4 | 5; // 6 zones: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right

interface AnimationState {
  ballX: number;
  ballY: number;
  ballSize: number;
  ballRotation: number;
  keeperX: number;
  keeperDiveDirection: number; // -1 left, 0 center, 1 right
  keeperDiveProgress: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const CANVAS_W = 600;
const CANVAS_H = 450;

// Goal proportions (front view, about 40% of canvas height)
const GOAL_LEFT = CANVAS_W * 0.18;
const GOAL_RIGHT = CANVAS_W * 0.82;
const GOAL_TOP = CANVAS_H * 0.08;
const GOAL_BOTTOM = CANVAS_H * 0.42;
const GOAL_W = GOAL_RIGHT - GOAL_LEFT;
const GOAL_H = GOAL_BOTTOM - GOAL_TOP;

const POST_WIDTH = 6;
const CROSSBAR_HEIGHT = 6;

// Zone positions relative to goal area (x%, y%)
const ZONE_POSITIONS: { x: number; y: number }[] = [
  { x: 0.2, y: 0.3 },  // top-left
  { x: 0.5, y: 0.25 }, // top-center
  { x: 0.8, y: 0.3 },  // top-right
  { x: 0.2, y: 0.72 }, // bottom-left
  { x: 0.5, y: 0.75 }, // bottom-center
  { x: 0.8, y: 0.72 }, // bottom-right
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

// Easing: ease out cubic
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Easing: ease in out quad
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// --- Drawing helpers ---

function drawPitch(ctx: CanvasRenderingContext2D) {
  // Green gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, "#0f2e0f");
  bgGrad.addColorStop(0.25, "#1B5E20");
  bgGrad.addColorStop(0.6, "#1a6b1f");
  bgGrad.addColorStop(1, "#145216");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grass stripe pattern
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  for (let i = 0; i < CANVAS_H; i += 20) {
    if (i % 40 === 0) {
      ctx.fillRect(0, i, CANVAS_W, 20);
    }
  }

  // Goal area box (6 yard box)
  const sixYardLeft = CANVAS_W * 0.3;
  const sixYardRight = CANVAS_W * 0.7;
  const sixYardBottom = GOAL_BOTTOM + 40;
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sixYardLeft, GOAL_BOTTOM);
  ctx.lineTo(sixYardLeft, sixYardBottom);
  ctx.lineTo(sixYardRight, sixYardBottom);
  ctx.lineTo(sixYardRight, GOAL_BOTTOM);
  ctx.stroke();

  // Penalty box (18 yard box)
  const penBoxLeft = CANVAS_W * 0.12;
  const penBoxRight = CANVAS_W * 0.88;
  const penBoxBottom = CANVAS_H * 0.7;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(penBoxLeft, GOAL_BOTTOM - 5);
  ctx.lineTo(penBoxLeft, penBoxBottom);
  ctx.lineTo(penBoxRight, penBoxBottom);
  ctx.lineTo(penBoxRight, GOAL_BOTTOM - 5);
  ctx.stroke();

  // Penalty spot
  const spotX = CANVAS_W / 2;
  const spotY = CANVAS_H * 0.82;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(spotX, spotY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Penalty arc (subtle)
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(spotX, spotY, 50, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

function drawGoal(ctx: CanvasRenderingContext2D) {
  // Net background (dark with grid)
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(GOAL_LEFT, GOAL_TOP, GOAL_W, GOAL_H);

  // Net mesh pattern (diamond pattern)
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 0.5;
  const netSize = 14;
  for (let x = GOAL_LEFT; x <= GOAL_RIGHT; x += netSize) {
    ctx.beginPath();
    ctx.moveTo(x, GOAL_TOP);
    ctx.lineTo(x, GOAL_BOTTOM);
    ctx.stroke();
  }
  for (let y = GOAL_TOP; y <= GOAL_BOTTOM; y += netSize) {
    ctx.beginPath();
    ctx.moveTo(GOAL_LEFT, y);
    ctx.lineTo(GOAL_RIGHT, y);
    ctx.stroke();
  }
  // Diagonal net lines for depth
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  for (let x = GOAL_LEFT - GOAL_H; x <= GOAL_RIGHT; x += netSize * 2) {
    ctx.beginPath();
    ctx.moveTo(Math.max(GOAL_LEFT, x), GOAL_TOP);
    ctx.lineTo(Math.max(GOAL_LEFT, x + GOAL_H), GOAL_BOTTOM);
    ctx.stroke();
  }

  // Goal posts (rounded white bars with subtle shadow)
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(GOAL_LEFT - POST_WIDTH + 1, GOAL_TOP + 2, POST_WIDTH, GOAL_H + 2);
  ctx.fillRect(GOAL_RIGHT + 1, GOAL_TOP + 2, POST_WIDTH, GOAL_H + 2);
  ctx.fillRect(GOAL_LEFT - POST_WIDTH + 1, GOAL_TOP - CROSSBAR_HEIGHT + 2, GOAL_W + POST_WIDTH * 2, CROSSBAR_HEIGHT);

  // Posts (white)
  const postGrad = ctx.createLinearGradient(GOAL_LEFT - POST_WIDTH, 0, GOAL_LEFT, 0);
  postGrad.addColorStop(0, "#e0e0e0");
  postGrad.addColorStop(0.5, "#ffffff");
  postGrad.addColorStop(1, "#d0d0d0");

  ctx.fillStyle = postGrad;
  ctx.fillRect(GOAL_LEFT - POST_WIDTH, GOAL_TOP, POST_WIDTH, GOAL_H);

  const postGrad2 = ctx.createLinearGradient(GOAL_RIGHT, 0, GOAL_RIGHT + POST_WIDTH, 0);
  postGrad2.addColorStop(0, "#d0d0d0");
  postGrad2.addColorStop(0.5, "#ffffff");
  postGrad2.addColorStop(1, "#e0e0e0");

  ctx.fillStyle = postGrad2;
  ctx.fillRect(GOAL_RIGHT, GOAL_TOP, POST_WIDTH, GOAL_H);

  // Crossbar
  const barGrad = ctx.createLinearGradient(0, GOAL_TOP - CROSSBAR_HEIGHT, 0, GOAL_TOP);
  barGrad.addColorStop(0, "#e0e0e0");
  barGrad.addColorStop(0.5, "#ffffff");
  barGrad.addColorStop(1, "#d0d0d0");

  ctx.fillStyle = barGrad;
  ctx.fillRect(GOAL_LEFT - POST_WIDTH, GOAL_TOP - CROSSBAR_HEIGHT, GOAL_W + POST_WIDTH * 2, CROSSBAR_HEIGHT);
}

function drawKeeper(
  ctx: CanvasRenderingContext2D,
  diveDir: number,
  diveProgress: number
) {
  const centerX = GOAL_LEFT + GOAL_W * 0.5;
  const groundY = GOAL_BOTTOM - 2;

  // Dive offset and body tilt
  const diveOffset = diveDir * diveProgress * 110;
  const bodyTilt = diveDir * diveProgress * 0.45; // radians
  const verticalShift = Math.abs(diveProgress) * 20; // lift off ground slightly during dive

  ctx.save();
  ctx.translate(centerX + diveOffset, groundY - verticalShift);
  ctx.rotate(bodyTilt);

  const bodyH = 55;
  const bodyW = 22;
  const headR = 10;

  // --- Legs (behind body) ---
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  // Left leg
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  if (diveProgress > 0.1) {
    // During dive: legs trail
    ctx.lineTo(-5 - diveDir * diveProgress * 15, 18 + diveProgress * 5);
  } else {
    ctx.lineTo(-5, 18);
  }
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(5, 0);
  if (diveProgress > 0.1) {
    ctx.lineTo(5 - diveDir * diveProgress * 10, 16 + diveProgress * 8);
  } else {
    ctx.lineTo(5, 18);
  }
  ctx.stroke();

  // Boots
  ctx.fillStyle = "#111111";
  if (diveProgress <= 0.1) {
    ctx.beginPath();
    ctx.ellipse(-5, 19, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, 19, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Jersey (body) ---
  // Bright keeper jersey (orange/yellow gradient)
  const jerseyGrad = ctx.createLinearGradient(-bodyW / 2, -bodyH, bodyW / 2, 0);
  jerseyGrad.addColorStop(0, "#ff8f00");
  jerseyGrad.addColorStop(0.4, "#ffa726");
  jerseyGrad.addColorStop(1, "#ff6f00");
  ctx.fillStyle = jerseyGrad;

  // Torso shape
  ctx.beginPath();
  ctx.moveTo(-bodyW / 2, -bodyH * 0.35);
  ctx.lineTo(-bodyW / 2 - 2, -bodyH * 0.8);
  ctx.quadraticCurveTo(-bodyW / 2 + 2, -bodyH, bodyW / 2 - 2, -bodyH);
  ctx.lineTo(bodyW / 2 + 2, -bodyH * 0.8);
  ctx.lineTo(bodyW / 2, -bodyH * 0.35);
  ctx.quadraticCurveTo(bodyW / 2 - 2, -bodyH * 0.3, 0, -bodyH * 0.28);
  ctx.quadraticCurveTo(-bodyW / 2 + 2, -bodyH * 0.3, -bodyW / 2, -bodyH * 0.35);
  ctx.fill();

  // Jersey number "1"
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 0, -bodyH * 0.6);

  // Shorts
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.moveTo(-bodyW / 2, -bodyH * 0.35);
  ctx.lineTo(-bodyW / 2 - 1, -bodyH * 0.1);
  ctx.lineTo(-2, -bodyH * 0.05);
  ctx.lineTo(2, -bodyH * 0.05);
  ctx.lineTo(bodyW / 2 + 1, -bodyH * 0.1);
  ctx.lineTo(bodyW / 2, -bodyH * 0.35);
  ctx.closePath();
  ctx.fill();

  // --- Arms with gloves ---
  const armY = -bodyH * 0.75;
  ctx.strokeStyle = "#ff8f00";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";

  // Glove size scales with dive
  const gloveSize = 7 + diveProgress * 4;

  // Left arm
  ctx.beginPath();
  ctx.moveTo(-bodyW / 2 - 2, armY);
  if (diveProgress > 0.1) {
    // Diving: arms stretch out in dive direction
    const armExtend = diveProgress * 35;
    const armLift = diveProgress * 25;
    ctx.lineTo(-bodyW / 2 - 15 - armExtend, armY - armLift);
    ctx.stroke();
    // Glove
    ctx.fillStyle = "#66bb6a";
    ctx.beginPath();
    ctx.arc(-bodyW / 2 - 15 - armExtend, armY - armLift, gloveSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#43a047";
    ctx.beginPath();
    ctx.arc(-bodyW / 2 - 15 - armExtend, armY - armLift, gloveSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standing: arms slightly out
    ctx.lineTo(-bodyW / 2 - 18, armY + 5);
    ctx.stroke();
    ctx.fillStyle = "#66bb6a";
    ctx.beginPath();
    ctx.arc(-bodyW / 2 - 18, armY + 5, gloveSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Right arm
  ctx.strokeStyle = "#ff8f00";
  ctx.beginPath();
  ctx.moveTo(bodyW / 2 + 2, armY);
  if (diveProgress > 0.1) {
    const armExtend = diveProgress * 35;
    const armLift = diveProgress * 25;
    ctx.lineTo(bodyW / 2 + 15 + armExtend, armY - armLift);
    ctx.stroke();
    ctx.fillStyle = "#66bb6a";
    ctx.beginPath();
    ctx.arc(bodyW / 2 + 15 + armExtend, armY - armLift, gloveSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#43a047";
    ctx.beginPath();
    ctx.arc(bodyW / 2 + 15 + armExtend, armY - armLift, gloveSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineTo(bodyW / 2 + 18, armY + 5);
    ctx.stroke();
    ctx.fillStyle = "#66bb6a";
    ctx.beginPath();
    ctx.arc(bodyW / 2 + 18, armY + 5, gloveSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Head ---
  // Hair / back of head
  ctx.fillStyle = "#3e2723";
  ctx.beginPath();
  ctx.arc(0, -bodyH - headR * 0.7, headR + 1, 0, Math.PI * 2);
  ctx.fill();

  // Skin
  ctx.fillStyle = "#FFCC80";
  ctx.beginPath();
  ctx.arc(0, -bodyH - headR * 0.7, headR, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.fill();

  // Face (simplified)
  ctx.fillStyle = "#FFCC80";
  ctx.beginPath();
  ctx.arc(0, -bodyH - headR * 0.5, headR * 0.85, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Ball shadow (on ground, more pronounced when ball is near ground)
  const shadowScale = Math.max(0.3, 1 - (CANVAS_H * 0.85 - y) / (CANVAS_H * 0.5));
  ctx.fillStyle = `rgba(0,0,0,${0.25 * shadowScale})`;
  ctx.beginPath();
  ctx.ellipse(x + 1, CANVAS_H * 0.85, size * 0.9 * shadowScale, size * 0.25 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball body (radial gradient for 3D look)
  const ballGrad = ctx.createRadialGradient(
    x - size * 0.25, y - size * 0.25, size * 0.05,
    x, y, size
  );
  ballGrad.addColorStop(0, "#ffffff");
  ballGrad.addColorStop(0.7, "#e8e8e8");
  ballGrad.addColorStop(1, "#b0b0b0");
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  // Ball outline
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Pentagon pattern (rotates with ball flight)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Center pentagon
  ctx.fillStyle = "rgba(30,30,30,0.65)";
  ctx.beginPath();
  const pentR = size * 0.32;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px = Math.cos(angle) * pentR;
    const py = Math.sin(angle) * pentR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Connecting lines from center pentagon to edge
  ctx.strokeStyle = "rgba(30,30,30,0.2)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px1 = Math.cos(angle) * pentR;
    const py1 = Math.sin(angle) * pentR;
    const px2 = Math.cos(angle) * size * 0.75;
    const py2 = Math.sin(angle) * size * 0.75;
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();

    // Small edge pentagons (partial)
    const midAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
    const ex = Math.cos(midAngle) * size * 0.7;
    const ey = Math.sin(midAngle) * size * 0.7;
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.18, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(30,30,30,0.12)";
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

function drawZones(
  ctx: CanvasRenderingContext2D,
  hoveredZone: number | null
) {
  const zoneW = GOAL_W / 3.3;
  const zoneH = GOAL_H / 2.8;

  for (let i = 0; i < 6; i++) {
    const zp = ZONE_POSITIONS[i];
    const zx = GOAL_LEFT + GOAL_W * zp.x;
    const zy = GOAL_TOP + GOAL_H * zp.y;
    const isHovered = hoveredZone === i;

    if (isHovered) {
      // Highlighted zone
      ctx.fillStyle = "rgba(0, 230, 118, 0.2)";
      ctx.beginPath();
      ctx.roundRect(zx - zoneW / 2, zy - zoneH / 2, zoneW, zoneH, 5);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 230, 118, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crosshair
      const crossSize = 12;
      ctx.strokeStyle = "rgba(0, 230, 118, 0.9)";
      ctx.lineWidth = 2;
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(zx - crossSize, zy);
      ctx.lineTo(zx - 4, zy);
      ctx.moveTo(zx + 4, zy);
      ctx.lineTo(zx + crossSize, zy);
      ctx.stroke();
      // Vertical
      ctx.beginPath();
      ctx.moveTo(zx, zy - crossSize);
      ctx.lineTo(zx, zy - 4);
      ctx.moveTo(zx, zy + 4);
      ctx.lineTo(zx, zy + crossSize);
      ctx.stroke();
      // Center dot
      ctx.fillStyle = "rgba(0, 230, 118, 0.9)";
      ctx.beginPath();
      ctx.arc(zx, zy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Subtle zone outline
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(zx - zoneW / 2, zy - zoneH / 2, zoneW, zoneH, 4);
      ctx.stroke();
      ctx.setLineDash([]);

      // Small target dot
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(zx, zy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

interface PenaltyKickProps {
  onClose: () => void;
  onScoreSubmit?: (score: number) => void;
}

export default function PenaltyKick({ onClose, onScoreSubmit }: PenaltyKickProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const [gameState, setGameState] = useState<GameState>("aiming");
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [resultText, setResultText] = useState("");
  const [isGoal, setIsGoal] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);

  const animStateRef = useRef<AnimationState>({
    ballX: 0.5,
    ballY: 0.85,
    ballSize: 14,
    ballRotation: 0,
    keeperX: 0.5,
    keeperDiveDirection: 0,
    keeperDiveProgress: 0,
    opacity: 1,
  });

  useEffect(() => {
    setHighScoreState(getHighScore());
  }, []);

  const spawnGoalParticles = useCallback(() => {
    const colors = ["#00E676", "#FFD700", "#ffffff", "#4CAF50", "#FFEB3B"];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        x: CANVAS_W / 2 + (Math.random() - 0.5) * 200,
        y: CANVAS_H * 0.15 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      });
    }
    particlesRef.current = newParticles;
  }, []);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const anim = animStateRef.current;

    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Pitch
    drawPitch(ctx);

    // Goal
    drawGoal(ctx);

    // Zone highlights (only in aiming state)
    if (gameState === "aiming") {
      drawZones(ctx, hoveredZone);
    }

    // Keeper
    drawKeeper(ctx, anim.keeperDiveDirection, anim.keeperDiveProgress);

    // Ball
    const bx = CANVAS_W * anim.ballX;
    const by = CANVAS_H * anim.ballY;
    drawBall(ctx, bx, by, anim.ballSize, anim.ballRotation, anim.opacity);

    // Particles
    if (particlesRef.current.length > 0) {
      drawParticles(ctx, particlesRef.current);
      // Update particles
      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          life: p.life - 0.02,
          size: p.size * 0.98,
        }))
        .filter(p => p.life > 0);
    }
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
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const zoneW = GOAL_W / 3.3;
    const zoneH = GOAL_H / 2.8;

    for (let i = 0; i < 6; i++) {
      const zp = ZONE_POSITIONS[i];
      const zx = GOAL_LEFT + GOAL_W * zp.x;
      const zy = GOAL_TOP + GOAL_H * zp.y;

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

    const targetX = (GOAL_LEFT + GOAL_W * ZONE_POSITIONS[zone].x) / CANVAS_W;
    const targetY = (GOAL_TOP + GOAL_H * ZONE_POSITIONS[zone].y) / CANVAS_H;

    const startBallX = 0.5;
    const startBallY = 0.85;
    const startBallSize = 14;
    const endBallSize = 9;

    // Slight curve: ball curves slightly toward the corner for top corners
    const curveAmplitude = (zone === 0 || zone === 2) ? 0.03 : 0.015;
    const curveDir = zone <= 2 ? (zone === 0 ? 1 : zone === 2 ? -1 : 0) : (zone === 3 ? 1 : zone === 5 ? -1 : 0);

    let frame = 0;
    const totalFrames = 22; // Snappy

    const animate = () => {
      frame++;
      const t = Math.min(frame / totalFrames, 1);
      const ease = easeOutCubic(t);

      // Ball position with slight curve
      const curveOffset = Math.sin(t * Math.PI) * curveAmplitude * curveDir;
      animStateRef.current.ballX = startBallX + (targetX - startBallX) * ease + curveOffset;
      animStateRef.current.ballY = startBallY + (targetY - startBallY) * ease;
      animStateRef.current.ballSize = startBallSize + (endBallSize - startBallSize) * ease;
      animStateRef.current.ballRotation += 0.3; // Spin

      // Keeper dive (slightly delayed, smooth)
      const keeperT = Math.max(0, (t - 0.1) / 0.9);
      animStateRef.current.keeperDiveDirection = diveDir;
      animStateRef.current.keeperDiveProgress = easeInOutQuad(Math.min(keeperT * 1.3, 1));

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        // Result
        if (saved) {
          setResultText("SAVED!");
          setIsGoal(false);
          setTimeout(() => {
            if (streak > 0 && onScoreSubmit) {
              onScoreSubmit(streak);
            }
            setGameState("gameover");
          }, 1500);
        } else {
          setResultText("GOAL!");
          setIsGoal(true);
          spawnGoalParticles();
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
              ballY: 0.85,
              ballSize: 14,
              ballRotation: 0,
              keeperX: 0.5,
              keeperDiveDirection: 0,
              keeperDiveProgress: 0,
              opacity: 1,
            };
            setResultText("");
            setGameState("aiming");
            setHoveredZone(null);
          }, 1500);
        }
        setGameState("result");
      }
    };

    requestAnimationFrame(animate);
  }, [gameState, streak, highScore, spawnGoalParticles]);

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
    particlesRef.current = [];
    animStateRef.current = {
      ballX: 0.5,
      ballY: 0.85,
      ballSize: 14,
      ballRotation: 0,
      keeperX: 0.5,
      keeperDiveDirection: 0,
      keeperDiveProgress: 0,
      opacity: 1,
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
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
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full cursor-crosshair touch-none"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Result overlay, positioned above goal area so it doesn't overlap keeper */}
        {resultText && (
          <div
            className="absolute left-0 right-0 flex justify-center pointer-events-none"
            style={{ top: "2%" }}
          >
            <span
              className={`font-heading text-5xl md:text-6xl font-extrabold uppercase tracking-wider ${
                isGoal
                  ? "text-accent animate-bounce"
                  : "text-red-400"
              }`}
              style={{
                textShadow: isGoal
                  ? "0 0 30px rgba(0,230,118,0.6), 0 4px 20px rgba(0,0,0,0.5)"
                  : "0 0 20px rgba(239,68,68,0.4), 0 4px 20px rgba(0,0,0,0.5)",
              }}
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
