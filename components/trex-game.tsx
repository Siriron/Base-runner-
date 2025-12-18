"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface TRexGameProps {
  highScore: number;
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  recordHighScoreOnChain: (score: number) => Promise<void>;
}

export function TRexGame({
  highScore,
  onScore,
  onGameOver,
  recordHighScoreOnChain,
}: TRexGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    for (let i = 0; i < 5; i++) mountainsRef.current.push({ x: i * 300, h: 100 + Math.random() * 50 });
    for (let i = 0; i < 60; i++) starsRef.current.push({ x: Math.random() * canvas.width, y: Math.random() * 200, r: Math.random() * 2 + 1 });

    let frame = 0;
    let speed = BASE_SPEED;
    let lastCycle: "day" | "night" | null = null;

    const spawnCloud = () => cloudsRef.current.push({ x: canvas.width, y: Math.random() * 200 + 40, w: 120, h: 40 });
    const spawnDust = (x: number, y: number) => {
      for (let i = 0; i < 8; i++) particlesRef.current.push({ x, y, vx: Math.random() * 2 - 1, vy: Math.random() * -2, life: 25 });
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
      if (e.code === "Space") { e.preventDefault(); unlockAudio(); jump(); }
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

      // … rest of game loop (sky, mountains, clouds, obstacles, rex, particles, score) …

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
