"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface TRexGameProps {
  highScore: number;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  recordHighScoreOnChain: (score: number) => Promise<void>;
}

export default function TRexGame({
  highScore,
  onScore,
  onGameOver,
  recordHighScoreOnChain,
}: TRexGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state refs to avoid re-rendering every frame
  const rexRef = useRef({ x: 90, y: 0, w: 52, h: 56, vy: 0, jumping: false });
  const obstaclesRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const cloudsRef = useRef<any[]>([]);
  const starsRef = useRef<any[]>([]);
  const mountainsRef = useRef<any[]>([]);
  const scoreRef = useRef(0);
  const runningRef = useRef(true);
  const submittedRef = useRef(false);
  const audioUnlocked = useRef(false);
  const sounds = useRef<Record<string, HTMLAudioElement>>({});

  const [gameOver, setGameOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const unlockAudio = useCallback(() => {
    if (audioUnlocked.current) return;
    audioUnlocked.current = true;

    const make = (url: string, loop = false, volume = 0.2) => {
      const a = new Audio(url);
      a.loop = loop;
      a.volume = volume;
      return a;
    };

    sounds.current = {
      jump: make("https://www.soundjay.com/button/sounds/button-16.mp3"),
      hit: make("https://www.soundjay.com/button/sounds/button-10.mp3"),
      score: make("https://www.soundjay.com/button/sounds/button-3.mp3", false, 0.15),
      day: make("https://www.soundjay.com/nature/sounds/desert-wind-1.mp3", true, 0.07),
      night: make("https://www.soundjay.com/nature/sounds/crickets-1.mp3", true, 0.07),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const GROUND_Y = canvas.height - 130;
    const GRAVITY = 0.75;
    const JUMP_FORCE = -15;
    const BASE_SPEED = 6;

    rexRef.current.y = GROUND_Y;

    for (let i = 0; i < 5; i++) {
      mountainsRef.current.push({ x: i * 300, h: 100 + Math.random() * 50 });
    }

    for (let i = 0; i < 60; i++) {
      starsRef.current.push({ x: Math.random() * canvas.width, y: Math.random() * 200, r: Math.random() * 2 + 1 });
    }

    let frame = 0;
    let speed = BASE_SPEED;
    let lastCycle: "day" | "night" | null = null;

    const spawnCloud = () => {
      cloudsRef.current.push({ x: canvas.width, y: Math.random() * 200 + 40, w: 120, h: 40 });
    };

    const spawnDust = (x: number, y: number) => {
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({ x, y, vx: Math.random() * 2 - 1, vy: Math.random() * -2, life: 25 });
      }
    };

    const spawnObstacle = () => {
      const r = Math.random();
      if (r < 0.6) obstaclesRef.current.push({ type: "cactus", x: canvas.width, y: GROUND_Y - 55, w: 26, h: 55 });
      else if (r < 0.85) obstaclesRef.current.push({ type: "cactus", x: canvas.width, y: GROUND_Y - 75, w: 26, h: 75 });
      else obstaclesRef.current.push({ type: "bird", x: canvas.width, y: GROUND_Y - 100, w: 50, h: 34, flap: 0 });
    };

    const jump = () => {
      if (!rexRef.current.jumping && runningRef.current) {
        rexRef.current.vy = JUMP_FORCE;
        rexRef.current.jumping = true;
        sounds.current.jump?.play();
        spawnDust(rexRef.current.x + rexRef.current.w / 2, rexRef.current.y + rexRef.current.h);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        unlockAudio();
        jump();
      }
    };

    canvas.addEventListener("mousedown", () => { unlockAudio(); jump(); });
    canvas.addEventListener("touchstart", e => { e.preventDefault(); unlockAudio(); jump(); }, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    const loop = () => {
      if (!runningRef.current) return;
      frame++;

      const cycle: "day" | "night" = Math.sin(frame * 0.0015) > 0 ? "day" : "night";
      if (cycle !== lastCycle && audioUnlocked.current) {
        sounds.current.day?.pause();
        sounds.current.night?.pause();
        sounds.current[cycle]?.play();
        lastCycle = cycle;
      }

      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (cycle === "day") {
        sky.addColorStop(0, "#6EC6FF");
        sky.addColorStop(1, "#FFE0B2");
      } else {
        sky.addColorStop(0, "#0B132B");
        sky.addColorStop(1, "#1C2541");
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (cycle === "night") {
        ctx.fillStyle = "#FFF";
        starsRef.current.forEach(s => ctx.fillRect(s.x, s.y, s.r, s.r));
      }

      mountainsRef.current.forEach(m => {
        ctx.fillStyle = cycle === "day" ? "rgba(217,176,140,0.5)" : "rgba(50,50,80,0.5)";
        ctx.beginPath();
        ctx.moveTo(m.x, GROUND_Y);
        ctx.lineTo(m.x + 150, GROUND_Y - m.h);
        ctx.lineTo(m.x + 300, GROUND_Y);
        ctx.fill();
        m.x -= speed * 0.2;
        if (m.x + 300 < 0) m.x = canvas.width;
      });

      if (cycle === "day" && frame % 200 === 0) spawnCloud();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      cloudsRef.current.forEach((c, i) => {
        c.x -= speed * 0.2;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (c.x + c.w < 0) cloudsRef.current.splice(i, 1);
      });

      ctx.fillStyle = cycle === "day" ? "#E6C27A" : "#3A2E2A";
      ctx.fillRect(0, GROUND_Y + rexRef.current.h, canvas.width, canvas.height);

      rexRef.current.vy += GRAVITY;
      rexRef.current.y += rexRef.current.vy;
      if (rexRef.current.y >= GROUND_Y) {
        if (rexRef.current.jumping) spawnDust(rexRef.current.x + rexRef.current.w / 2, rexRef.current.y + rexRef.current.h);
        rexRef.current.y = GROUND_Y;
        rexRef.current.vy = 0;
        rexRef.current.jumping = false;
      }

      const rexGrad = ctx.createLinearGradient(rexRef.current.x, rexRef.current.y, rexRef.current.x, rexRef.current.y + rexRef.current.h);
      rexGrad.addColorStop(0, "#FFB703");
      rexGrad.addColorStop(1, "#FB8500");
      ctx.fillStyle = rexGrad;
      ctx.fillRect(rexRef.current.x, rexRef.current.y, rexRef.current.w, rexRef.current.h);
      ctx.fillStyle = "#000";
      ctx.fillRect(rexRef.current.x + 36, rexRef.current.y + 16, 6, 6);

      if (frame % 90 === 0) spawnObstacle();
      obstaclesRef.current.forEach((o, i) => {
        o.x -= speed;
        if (o.type === "cactus") {
          const g = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
          g.addColorStop(0, "#2EC4B6");
          g.addColorStop(1, "#1B9AAA");
          ctx.fillStyle = g;
          ctx.fillRect(o.x, o.y, o.w, o.h);
        } else {
          o.flap += 0.3;
          ctx.fillStyle = "#8D5524";
          ctx.fillRect(o.x, o.y, o.w, o.h);
        }

        const rex = rexRef.current;
        if (rex.x < o.x + o.w && rex.x + rex.w > o.x && rex.y < o.y + o.h && rex.y + rex.h > o.y) {
          runningRef.current = false;
          setGameOver(true);
          sounds.current.hit?.play();
          onGameOver(scoreRef.current);

          if (!submittedRef.current && scoreRef.current > highScore) {
            submittedRef.current = true;
            recordHighScoreOnChain(scoreRef.current).catch(() => {});
          }
        }

        if (o.x + o.w < 0) {
          obstaclesRef.current.splice(i, 1);
          scoreRef.current++;
          onScore(scoreRef.current);
          sounds.current.score?.play();
        }
      });

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = "rgba(244,162,97,0.8)";
        ctx.fillRect(p.x, p.y, 4, 4);
        if (p.life <= 0) particlesRef.current.splice(i, 1);
      });

      ctx.font = "bold 44px monospace";
      ctx.fillStyle = cycle === "day" ? "#333" : "#EEE";
      ctx.fillText(scoreRef.current.toString().padStart(6, "0"), canvas.width - 240, 64);

      speed += 0.001;
      requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", resize);
      sounds.current.day?.pause();
      sounds.current.night?.pause();
    };
  }, [gameKey, highScore, onGameOver, onScore, recordHighScoreOnChain, unlockAudio]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />

      {gameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <h2 className="text-4xl font-bold">GAME OVER</h2>
            <p className="text-2xl">Score: {scoreRef.current}</p>
            {scoreRef.current > highScore && (
              <p className="text-green-600 font-bold">🏆 New High Score Saved On‑Chain</p>
            )}
            <button
              className="bg-gradient-to-r from-orange-400 to-pink-500 hover:scale-105 transition text-white px-8 py-4 rounded-xl font-bold"
              onClick={() => {
                scoreRef.current = 0;
                setGameOver(false);
                obstaclesRef.current = [];
                particlesRef.current = [];
                cloudsRef.current = [];
                setGameKey(k => k + 1);
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
      }
