"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type GameState = "aiming" | "shooting" | "result" | "gameover";
type ShotZone = 0 | 1 | 2 | 3 | 4 | 5;

interface AnimState {
  ballX: number;
  ballY: number;
  ballSize: number;
  ballRotation: number;
  keeperX: number;
  keeperY: number;
  keeperDiveAngle: number; // rotation in radians
  keeperDiveProgress: number; // 0 to 1
  keeperTargetZone: number; // which zone the keeper is diving toward
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

// Goal fills the top portion of canvas. Front-on view.
const GOAL_LEFT = CANVAS_W * 0.15;
const GOAL_RIGHT = CANVAS_W * 0.85;
const GOAL_TOP = CANVAS_H * 0.06;
const GOAL_BOTTOM = CANVAS_H * 0.44;
const GOAL_W = GOAL_RIGHT - GOAL_LEFT;
const GOAL_H = GOAL_BOTTOM - GOAL_TOP;

const POST_WIDTH = 6;
const CROSSBAR_HEIGHT = 6;

// Ball starting position (penalty spot)
const BALL_START_X = CANVAS_W / 2;
const BALL_START_Y = CANVAS_H * 0.82;

// Keeper center position (standing in goal)
const KEEPER_CENTER_X = GOAL_LEFT + GOAL_W / 2;
const KEEPER_CENTER_Y = GOAL_BOTTOM - 5;

// Zone target positions: where the ball should end up in the goal
// 6 zones: top-left(0), top-center(1), top-right(2), bottom-left(3), bottom-center(4), bottom-right(5)
const ZONE_TARGETS: { x: number; y: number }[] = [
  { x: GOAL_LEFT + GOAL_W * 0.17, y: GOAL_TOP + GOAL_H * 0.28 }, // top-left
  { x: GOAL_LEFT + GOAL_W * 0.50, y: GOAL_TOP + GOAL_H * 0.22 }, // top-center
  { x: GOAL_LEFT + GOAL_W * 0.83, y: GOAL_TOP + GOAL_H * 0.28 }, // top-right
  { x: GOAL_LEFT + GOAL_W * 0.17, y: GOAL_TOP + GOAL_H * 0.72 }, // bottom-left
  { x: GOAL_LEFT + GOAL_W * 0.50, y: GOAL_TOP + GOAL_H * 0.75 }, // bottom-center
  { x: GOAL_LEFT + GOAL_W * 0.83, y: GOAL_TOP + GOAL_H * 0.72 }, // bottom-right
];

// Zone hit-test rectangles for clicking
const ZONE_HIT_W = GOAL_W / 3.2;
const ZONE_HIT_H = GOAL_H / 2.6;

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

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// --- Drawing ---

function drawPitch(ctx: CanvasRenderingContext2D) {
  // Dark green gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, "#0f2e0f");
  bgGrad.addColorStop(0.3, "#1B5E20");
  bgGrad.addColorStop(0.6, "#1a6b1f");
  bgGrad.addColorStop(1, "#145216");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grass stripes
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  for (let i = 0; i < CANVAS_H; i += 20) {
    if (i % 40 === 0) ctx.fillRect(0, i, CANVAS_W, 20);
  }

  // 6-yard box
  const sixLeft = CANVAS_W * 0.3;
  const sixRight = CANVAS_W * 0.7;
  const sixBottom = GOAL_BOTTOM + 30;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sixLeft, GOAL_BOTTOM);
  ctx.lineTo(sixLeft, sixBottom);
  ctx.lineTo(sixRight, sixBottom);
  ctx.lineTo(sixRight, GOAL_BOTTOM);
  ctx.stroke();

  // 18-yard box
  const penLeft = CANVAS_W * 0.12;
  const penRight = CANVAS_W * 0.88;
  const penBottom = CANVAS_H * 0.68;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.moveTo(penLeft, GOAL_BOTTOM - 5);
  ctx.lineTo(penLeft, penBottom);
  ctx.lineTo(penRight, penBottom);
  ctx.lineTo(penRight, GOAL_BOTTOM - 5);
  ctx.stroke();

  // Penalty spot
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(BALL_START_X, BALL_START_Y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Penalty arc
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(BALL_START_X, BALL_START_Y, 45, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

function drawGoal(ctx: CanvasRenderingContext2D) {
  // Net background
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(GOAL_LEFT, GOAL_TOP, GOAL_W, GOAL_H);

  // Net mesh
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
  // Diagonal net lines
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  for (let x = GOAL_LEFT - GOAL_H; x <= GOAL_RIGHT; x += netSize * 2) {
    ctx.beginPath();
    ctx.moveTo(Math.max(GOAL_LEFT, x), GOAL_TOP);
    ctx.lineTo(Math.max(GOAL_LEFT, x + GOAL_H), GOAL_BOTTOM);
    ctx.stroke();
  }

  // Post shadows
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(GOAL_LEFT - POST_WIDTH + 1, GOAL_TOP + 2, POST_WIDTH, GOAL_H + 2);
  ctx.fillRect(GOAL_RIGHT + 1, GOAL_TOP + 2, POST_WIDTH, GOAL_H + 2);
  ctx.fillRect(GOAL_LEFT - POST_WIDTH + 1, GOAL_TOP - CROSSBAR_HEIGHT + 2, GOAL_W + POST_WIDTH * 2, CROSSBAR_HEIGHT);

  // Left post
  const postGradL = ctx.createLinearGradient(GOAL_LEFT - POST_WIDTH, 0, GOAL_LEFT, 0);
  postGradL.addColorStop(0, "#e0e0e0");
  postGradL.addColorStop(0.5, "#ffffff");
  postGradL.addColorStop(1, "#d0d0d0");
  ctx.fillStyle = postGradL;
  ctx.fillRect(GOAL_LEFT - POST_WIDTH, GOAL_TOP, POST_WIDTH, GOAL_H);

  // Right post
  const postGradR = ctx.createLinearGradient(GOAL_RIGHT, 0, GOAL_RIGHT + POST_WIDTH, 0);
  postGradR.addColorStop(0, "#d0d0d0");
  postGradR.addColorStop(0.5, "#ffffff");
  postGradR.addColorStop(1, "#e0e0e0");
  ctx.fillStyle = postGradR;
  ctx.fillRect(GOAL_RIGHT, GOAL_TOP, POST_WIDTH, GOAL_H);

  // Crossbar
  const barGrad = ctx.createLinearGradient(0, GOAL_TOP - CROSSBAR_HEIGHT, 0, GOAL_TOP);
  barGrad.addColorStop(0, "#e0e0e0");
  barGrad.addColorStop(0.5, "#ffffff");
  barGrad.addColorStop(1, "#d0d0d0");
  ctx.fillStyle = barGrad;
  ctx.fillRect(GOAL_LEFT - POST_WIDTH, GOAL_TOP - CROSSBAR_HEIGHT, GOAL_W + POST_WIDTH * 2, CROSSBAR_HEIGHT);
}

/**
 * Draw the keeper. The keeper dives toward a specific zone target.
 * diveProgress: 0 = standing center, 1 = fully diving to target zone.
 * targetZone: which zone index the keeper is diving toward.
 */
function drawKeeper(
  ctx: CanvasRenderingContext2D,
  targetZone: number,
  diveProgress: number
) {
  ctx.save();

  // Figure out where the keeper should end up when fully diving
  const target = ZONE_TARGETS[targetZone] || { x: KEEPER_CENTER_X, y: KEEPER_CENTER_Y };

  // Standing position: centered in goal, feet on the ground line
  const standX = KEEPER_CENTER_X;
  const standY = KEEPER_CENTER_Y;

  // Dive position: move toward the target zone
  const diveX = target.x;
  // For vertical: keeper moves up for top zones, stays low for bottom zones
  const isTopZone = targetZone <= 2;
  const diveY = isTopZone
    ? target.y + 15 // stretch upward toward top corners
    : target.y - 5; // stretch sideways for bottom corners

  // Interpolate position
  const dp = easeInOutQuad(diveProgress);
  const kx = standX + (diveX - standX) * dp;
  const ky = standY + (diveY - standY) * dp;

  // Dive angle: tilt body in dive direction
  const diveDirection = diveX < standX ? -1 : diveX > standX ? 1 : 0;
  const tiltAngle = diveDirection * dp * 0.55; // radians, keeper tilts into dive

  // Body dimensions
  const bodyH = 50;
  const bodyW = 18;
  const headR = 8;

  ctx.translate(kx, ky);
  ctx.rotate(tiltAngle);

  // --- Legs ---
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";

  if (dp < 0.15) {
    // Standing: legs straight down
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-6, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(6, 16);
    ctx.stroke();

    // Boots
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(-6, 17, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, 17, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Diving: legs trail behind, slight split
    const trail = dp * 20 * -diveDirection;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-4 + trail * 0.6, 14 + dp * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(4 + trail * 0.4, 12 + dp * 12);
    ctx.stroke();
  }

  // --- Shorts ---
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.moveTo(-bodyW / 2, -bodyH * 0.3);
  ctx.lineTo(-bodyW / 2 - 1, -bodyH * 0.05);
  ctx.lineTo(-2, 0);
  ctx.lineTo(2, 0);
  ctx.lineTo(bodyW / 2 + 1, -bodyH * 0.05);
  ctx.lineTo(bodyW / 2, -bodyH * 0.3);
  ctx.closePath();
  ctx.fill();

  // --- Jersey (torso) ---
  const jerseyGrad = ctx.createLinearGradient(-bodyW / 2, -bodyH, bodyW / 2, 0);
  jerseyGrad.addColorStop(0, "#ff8f00");
  jerseyGrad.addColorStop(0.4, "#ffa726");
  jerseyGrad.addColorStop(1, "#ff6f00");
  ctx.fillStyle = jerseyGrad;
  ctx.beginPath();
  ctx.moveTo(-bodyW / 2, -bodyH * 0.3);
  ctx.lineTo(-bodyW / 2 - 2, -bodyH * 0.75);
  ctx.quadraticCurveTo(-bodyW / 2, -bodyH, 0, -bodyH * 0.98);
  ctx.quadraticCurveTo(bodyW / 2, -bodyH, bodyW / 2 + 2, -bodyH * 0.75);
  ctx.lineTo(bodyW / 2, -bodyH * 0.3);
  ctx.closePath();
  ctx.fill();

  // Jersey number
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 0, -bodyH * 0.6);

  // --- Arms ---
  const armBaseY = -bodyH * 0.72;
  ctx.strokeStyle = "#ff8f00";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";

  // Compute arm endpoints based on dive state
  let leftArmEndX: number, leftArmEndY: number;
  let rightArmEndX: number, rightArmEndY: number;

  if (dp < 0.15) {
    // Standing: arms out to sides, slightly down (ready position)
    leftArmEndX = -(18 + dp * 5);
    leftArmEndY = armBaseY + 3;
    rightArmEndX = 18 + dp * 5;
    rightArmEndY = armBaseY + 3;
  } else if (diveDirection === 0) {
    // Center dive: both arms reach upward
    const reach = dp * 30;
    const lift = dp * (isTopZone ? 28 : 8);
    leftArmEndX = -(15 + reach * 0.6);
    leftArmEndY = armBaseY - lift;
    rightArmEndX = 15 + reach * 0.6;
    rightArmEndY = armBaseY - lift;
  } else {
    // Left or right dive: leading arm stretches far, trailing arm follows
    const leadReach = 18 + dp * 42;
    const trailReach = 10 + dp * 22;
    const leadLift = dp * (isTopZone ? 28 : 6);
    const trailLift = dp * (isTopZone ? 18 : 3);

    if (diveDirection < 0) {
      // Diving left: left arm leads
      leftArmEndX = -(leadReach);
      leftArmEndY = armBaseY - leadLift;
      rightArmEndX = -(trailReach * 0.6);
      rightArmEndY = armBaseY - trailLift;
    } else {
      // Diving right: right arm leads
      rightArmEndX = leadReach;
      rightArmEndY = armBaseY - leadLift;
      leftArmEndX = trailReach * 0.6;
      leftArmEndY = armBaseY - trailLift;
    }
  }

  // Draw left arm
  ctx.beginPath();
  ctx.moveTo(-(bodyW / 2 + 1), armBaseY);
  ctx.lineTo(leftArmEndX, leftArmEndY);
  ctx.stroke();

  // Draw right arm
  ctx.beginPath();
  ctx.moveTo(bodyW / 2 + 1, armBaseY);
  ctx.lineTo(rightArmEndX, rightArmEndY);
  ctx.stroke();

  // Gloves: small filled rectangles at hand positions
  ctx.fillStyle = "#66bb6a";
  const gloveW = 6 + dp * 3;
  const gloveH = 4 + dp * 2;

  ctx.save();
  ctx.translate(leftArmEndX, leftArmEndY);
  ctx.rotate(tiltAngle * 0.3);
  ctx.fillRect(-gloveW / 2, -gloveH / 2, gloveW, gloveH);
  ctx.restore();

  ctx.save();
  ctx.translate(rightArmEndX, rightArmEndY);
  ctx.rotate(tiltAngle * 0.3);
  ctx.fillRect(-gloveW / 2, -gloveH / 2, gloveW, gloveH);
  ctx.restore();

  // --- Head ---
  // Hair
  ctx.fillStyle = "#3e2723";
  ctx.beginPath();
  ctx.arc(0, -bodyH - headR * 0.6, headR + 1, 0, Math.PI * 2);
  ctx.fill();
  // Face
  ctx.fillStyle = "#FFCC80";
  ctx.beginPath();
  ctx.arc(0, -bodyH - headR * 0.4, headR * 0.9, 0, Math.PI * 2);
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

  // Shadow on ground
  const shadowY = Math.min(BALL_START_Y, CANVAS_H * 0.85);
  const distFromGround = Math.max(0, shadowY - y);
  const shadowScale = Math.max(0.3, 1 - distFromGround / (CANVAS_H * 0.5));
  ctx.fillStyle = `rgba(0,0,0,${0.2 * shadowScale})`;
  ctx.beginPath();
  ctx.ellipse(x + 1, shadowY, size * 0.8 * shadowScale, size * 0.2 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball body
  const ballGrad = ctx.createRadialGradient(x - size * 0.25, y - size * 0.25, size * 0.05, x, y, size);
  ballGrad.addColorStop(0, "#ffffff");
  ballGrad.addColorStop(0.7, "#e8e8e8");
  ballGrad.addColorStop(1, "#b0b0b0");
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Pentagon pattern
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "rgba(30,30,30,0.6)";
  ctx.beginPath();
  const pentR = size * 0.3;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px = Math.cos(angle) * pentR;
    const py = Math.sin(angle) * pentR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(30,30,30,0.18)";
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px1 = Math.cos(angle) * pentR;
    const py1 = Math.sin(angle) * pentR;
    const px2 = Math.cos(angle) * size * 0.7;
    const py2 = Math.sin(angle) * size * 0.7;
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawZones(ctx: CanvasRenderingContext2D, hoveredZone: number | null) {
  for (let i = 0; i < 6; i++) {
    const zt = ZONE_TARGETS[i];
    const isHovered = hoveredZone === i;

    if (isHovered) {
      ctx.fillStyle = "rgba(0, 230, 118, 0.2)";
      ctx.beginPath();
      ctx.roundRect(zt.x - ZONE_HIT_W / 2, zt.y - ZONE_HIT_H / 2, ZONE_HIT_W, ZONE_HIT_H, 5);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 230, 118, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crosshair
      const cs = 12;
      ctx.strokeStyle = "rgba(0, 230, 118, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(zt.x - cs, zt.y);
      ctx.lineTo(zt.x - 4, zt.y);
      ctx.moveTo(zt.x + 4, zt.y);
      ctx.lineTo(zt.x + cs, zt.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(zt.x, zt.y - cs);
      ctx.lineTo(zt.x, zt.y - 4);
      ctx.moveTo(zt.x, zt.y + 4);
      ctx.lineTo(zt.x, zt.y + cs);
      ctx.stroke();

      ctx.fillStyle = "rgba(0, 230, 118, 0.9)";
      ctx.beginPath();
      ctx.arc(zt.x, zt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(zt.x - ZONE_HIT_W / 2, zt.y - ZONE_HIT_H / 2, ZONE_HIT_W, ZONE_HIT_H, 4);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.arc(zt.x, zt.y, 2, 0, Math.PI * 2);
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

  const animStateRef = useRef<AnimState>({
    ballX: BALL_START_X,
    ballY: BALL_START_Y,
    ballSize: 14,
    ballRotation: 0,
    keeperX: KEEPER_CENTER_X,
    keeperY: KEEPER_CENTER_Y,
    keeperDiveAngle: 0,
    keeperDiveProgress: 0,
    keeperTargetZone: 4, // center bottom (default)
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

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    drawPitch(ctx);
    drawGoal(ctx);

    if (gameState === "aiming") {
      drawZones(ctx, hoveredZone);
    }

    // Draw keeper
    drawKeeper(ctx, anim.keeperTargetZone, anim.keeperDiveProgress);

    // Draw ball
    drawBall(ctx, anim.ballX, anim.ballY, anim.ballSize, anim.ballRotation, 1);

    // Particles
    if (particlesRef.current.length > 0) {
      drawParticles(ctx, particlesRef.current);
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

  // Render loop
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

    for (let i = 0; i < 6; i++) {
      const zt = ZONE_TARGETS[i];
      if (
        x >= zt.x - ZONE_HIT_W / 2 &&
        x <= zt.x + ZONE_HIT_W / 2 &&
        y >= zt.y - ZONE_HIT_H / 2 &&
        y <= zt.y + ZONE_HIT_H / 2
      ) {
        return i;
      }
    }
    return null;
  }, []);

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    },
    [gameState, getZoneFromPosition]
  );

  const shoot = useCallback(
    (zone: ShotZone) => {
      if (gameState !== "aiming") return;
      setGameState("shooting");

      const saveZones = getKeeperSaveZones(streak);
      const saved = saveZones.includes(zone);

      // Ball target: the zone the user clicked
      const ballTarget = ZONE_TARGETS[zone];

      // Keeper target: if saved, keeper dives to the ball zone.
      // If missed, keeper dives to one of its other save zones (not the ball zone).
      let keeperDiveZone: number;
      if (saved) {
        keeperDiveZone = zone; // keeper goes where the ball goes
      } else {
        // Keeper dives to its primary save zone (first in the list)
        keeperDiveZone = saveZones[0];
      }

      // Animation
      const startBallX = BALL_START_X;
      const startBallY = BALL_START_Y;
      const startBallSize = 14;
      const endBallSize = 9;

      // Slight curve for corners
      const isCorner = zone === 0 || zone === 2 || zone === 3 || zone === 5;
      const curveAmplitude = isCorner ? 8 : 3;
      const curveDir = (zone % 3 === 0) ? 1 : (zone % 3 === 2) ? -1 : 0;

      let frame = 0;
      const totalFrames = 24;

      const animate = () => {
        frame++;
        const t = Math.min(frame / totalFrames, 1);
        const ease = easeOutCubic(t);

        // Ball position with slight lateral curve
        const curveOffset = Math.sin(t * Math.PI) * curveAmplitude * curveDir;
        animStateRef.current.ballX = startBallX + (ballTarget.x - startBallX) * ease + curveOffset;
        animStateRef.current.ballY = startBallY + (ballTarget.y - startBallY) * ease;
        animStateRef.current.ballSize = startBallSize + (endBallSize - startBallSize) * ease;
        animStateRef.current.ballRotation += 0.3;

        // Keeper dive: slightly delayed, same duration
        const keeperT = Math.max(0, (t - 0.08) / 0.92);
        animStateRef.current.keeperTargetZone = keeperDiveZone;
        animStateRef.current.keeperDiveProgress = Math.min(keeperT * 1.2, 1);

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
                ballX: BALL_START_X,
                ballY: BALL_START_Y,
                ballSize: 14,
                ballRotation: 0,
                keeperX: KEEPER_CENTER_X,
                keeperY: KEEPER_CENTER_Y,
                keeperDiveAngle: 0,
                keeperDiveProgress: 0,
                keeperTargetZone: 4,
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
    },
    [gameState, streak, highScore, spawnGoalParticles, onScoreSubmit]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    },
    [gameState, getZoneFromPosition, shoot]
  );

  const resetGame = useCallback(() => {
    setStreak(0);
    setGameState("aiming");
    setResultText("");
    setIsGoal(false);
    setHoveredZone(null);
    particlesRef.current = [];
    animStateRef.current = {
      ballX: BALL_START_X,
      ballY: BALL_START_Y,
      ballSize: 14,
      ballRotation: 0,
      keeperX: KEEPER_CENTER_X,
      keeperY: KEEPER_CENTER_Y,
      keeperDiveAngle: 0,
      keeperDiveProgress: 0,
      keeperTargetZone: 4,
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

        {/* Result overlay: positioned ABOVE the canvas area */}
        {resultText && (
          <div
            className="absolute left-0 right-0 flex justify-center pointer-events-none"
            style={{ bottom: "8px" }}
          >
            <span
              className={`font-heading text-4xl md:text-5xl font-extrabold uppercase tracking-wider px-4 py-1 rounded-lg ${
                isGoal
                  ? "text-accent bg-navy/80"
                  : "text-red-400 bg-navy/80"
              }`}
              style={{
                textShadow: isGoal
                  ? "0 0 20px rgba(0,230,118,0.5)"
                  : "0 0 15px rgba(239,68,68,0.4)",
                backdropFilter: "blur(4px)",
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
