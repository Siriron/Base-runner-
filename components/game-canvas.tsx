"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { useSoundManager } from "@/hooks/use-sound"

interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityY: number
  isJumping: boolean
  animationFrame: number
  frameCounter: number
  state: "running" | "jumping" | "falling" | "dead" | "celebrating"
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface Obstacle {
  x: number
  y: number
  type: "spike" | "block" | "barrier" | "drone"
  width: number
  height: number
}

export const GameCanvas: React.FC<{
  isGameActive: boolean
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
  onHighScore: (score: number) => void
  soundManager?: ReturnType<typeof useSoundManager>
}> = ({ isGameActive, onScore, onGameOver, onHighScore, soundManager }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const gameStateRef = useRef({
    running: isGameActive,
    score: 0,
    gameSpeed: 4,
    cameraX: 0,
    lastFrameTime: Date.now(),
    gameStartTime: Date.now(),
    safeSpawnDelay: 2000, // milliseconds before first obstacle spawns
  })
  const particlesRef = useRef<Particle[]>([])
  const obstaclesRef = useRef<Obstacle[]>([])

  const BASE_SPEED = 4
  const MAX_SPEED = 12
  const SPEED_INCREMENT = 0.002

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Player initialization
    const player: Player = {
      x: 100,
      y: canvas.height - 150,
      width: 24,
      height: 32,
      velocityY: 0,
      isJumping: false,
      animationFrame: 0,
      frameCounter: 0,
      state: "running",
    }

    const GRAVITY = 0.6
    const JUMP_STRENGTH = -15
    const GROUND_Y = canvas.height - 150
    let lastObstacleTime = 0

    const getObstacleSpawnInterval = (speed: number) => {
      return Math.max(80, 150 - speed * 8)
    }

    // Pixel art character "Blaze" - 3-frame animation
    const drawPlayer = (x: number, y: number, frame: number, state: string) => {
      const frameData = {
        running: [
          // Frame 1: Left foot forward
          [
            [10, 0, 4, 4],
            [8, 4, 8, 12],
            [4, 4, 4, 4],
            [12, 4, 4, 4],
            [8, 16, 8, 8],
            [6, 24, 4, 8],
            [12, 24, 4, 8],
          ],
          // Frame 2: Both feet neutral
          [
            [10, 0, 4, 4],
            [8, 4, 8, 12],
            [4, 4, 4, 4],
            [12, 4, 4, 4],
            [8, 16, 8, 8],
            [8, 24, 4, 8],
            [12, 24, 4, 8],
          ],
          // Frame 3: Right foot forward
          [
            [10, 0, 4, 4],
            [8, 4, 8, 12],
            [4, 4, 4, 4],
            [12, 4, 4, 4],
            [8, 16, 8, 8],
            [4, 24, 4, 8],
            [12, 24, 4, 8],
          ],
        ],
        jumping: [
          [
            [10, 0, 4, 4],
            [8, 4, 8, 12],
            [2, 4, 4, 4],
            [14, 4, 4, 4],
            [4, 16, 4, 8],
            [12, 16, 4, 8],
          ],
        ],
        falling: [
          [
            [10, 0, 4, 4],
            [8, 4, 8, 12],
            [2, 4, 4, 4],
            [14, 4, 4, 4],
            [4, 16, 4, 8],
            [12, 16, 4, 8],
          ],
        ],
        dead: [
          [
            [10, 0, 4, 4],
            [8, 4, 8, 12],
            [0, 4, 4, 4],
            [16, 4, 4, 4],
            [4, 16, 4, 8],
            [12, 16, 4, 8],
          ],
        ],
      }

      const selectedFrame = frameData[state as keyof typeof frameData]?.[frame] || frameData.running[frame]

      ctx!.fillStyle = "#FFD700"
      for (const [rx, ry, rw, rh] of selectedFrame) {
        ctx!.fillRect(x + rx, y + ry, rw, rh)
      }

      // Eyes
      ctx!.fillStyle = "#FF3CF0"
      ctx!.fillRect(x + 10, y + 2, 2, 2)
      ctx!.fillRect(x + 14, y + 2, 2, 2)
    }

    // Draw parallax background
    const drawBackground = (cameraX: number) => {
      ctx!.fillStyle = "#0A0A0A"
      ctx!.fillRect(0, 0, canvas.width, canvas.height)

      // Neon skyscrapers
      ctx!.strokeStyle = "#00E8FF"
      ctx!.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        const x = (i * 400 - cameraX * 0.3) % (canvas.width + 400)
        const height = 200 + i * 50
        ctx!.strokeRect(x, canvas.height - height, 100, height)

        // Windows
        ctx!.fillStyle = "#FF3CF0"
        for (let j = 0; j < Math.ceil(height / 50); j++) {
          for (let k = 0; k < 2; k++) {
            if (Math.random() > 0.5) {
              ctx!.fillRect(x + 20 + k * 40, canvas.height - height + 20 + j * 50, 15, 15)
            }
          }
        }
      }

      // Moving stars
      ctx!.fillStyle = "#00E8FF"
      for (let i = 0; i < 50; i++) {
        const x = ((i * 100 - cameraX * 0.1) % (canvas.width + 100)) - 50
        const y = 50 + ((i * 20) % (canvas.height - 200))
        ctx!.fillRect(x, y, 2, 2)
      }
    }

    const spawnObstacle = () => {
      const types: Obstacle["type"][] = ["spike", "block", "barrier", "drone"]
      const type = types[Math.floor(Math.random() * types.length)]

      let obstacle: Obstacle
      switch (type) {
        case "spike":
          obstacle = { x: canvas.width, y: GROUND_Y - 20, type: "spike", width: 20, height: 20 }
          break
        case "block":
          obstacle = { x: canvas.width, y: GROUND_Y - 40, type: "block", width: 40, height: 40 }
          break
        case "barrier":
          obstacle = { x: canvas.width, y: GROUND_Y - 60, type: "barrier", width: 60, height: 60 }
          break
        case "drone":
          obstacle = { x: canvas.width, y: GROUND_Y - 100, type: "drone", width: 30, height: 20 }
          break
      }
      obstaclesRef.current.push(obstacle)
    }

    // Animation loop
    let animationId: number
    const gameLoop = () => {
      gameStateRef.current.running = isGameActive
      const state = gameStateRef.current

      const currentTime = Date.now()
      const deltaTime = Math.min((currentTime - state.lastFrameTime) / 16.67, 2)
      state.lastFrameTime = currentTime

      if (state.running) {
        state.gameSpeed = Math.min(state.gameSpeed + SPEED_INCREMENT * deltaTime, MAX_SPEED)
      }

      // Draw background
      drawBackground(state.cameraX)

      // Update player
      if (state.running) {
        player.velocityY += GRAVITY
        player.y += player.velocityY

        if (player.y >= GROUND_Y) {
          player.y = GROUND_Y
          player.velocityY = 0
          player.isJumping = false
          player.state = "running"
        } else if (player.velocityY < 0) {
          player.state = "jumping"
        } else if (player.velocityY > 0) {
          player.state = "falling"
        }

        // Update animation
        player.frameCounter++
        if (player.frameCounter % 10 === 0) {
          player.animationFrame = (player.animationFrame + 1) % 3
        }

        const timeSinceStart = currentTime - state.gameStartTime
        if (timeSinceStart >= state.safeSpawnDelay) {
          const spawnInterval = getObstacleSpawnInterval(state.gameSpeed)
          if (currentTime - lastObstacleTime > spawnInterval) {
            spawnObstacle()
            lastObstacleTime = currentTime
          }
        }

        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          obstaclesRef.current[i].x -= state.gameSpeed * deltaTime * 10

          if (obstaclesRef.current[i].x < -50) {
            obstaclesRef.current.splice(i, 1)
            state.score += 10
            setScore(state.score)
            onScore(state.score)
          }
        }

        state.cameraX += state.gameSpeed * deltaTime * 10 * 0.5

        for (const obstacle of obstaclesRef.current) {
          if (Math.abs(player.x - obstacle.x) < 150) {
            if (
              player.x + player.width > obstacle.x + 2 &&
              player.x + 2 < obstacle.x + obstacle.width &&
              player.y + player.height > obstacle.y + 2 &&
              player.y + 4 < obstacle.y + obstacle.height
            ) {
              soundManager?.playSound("hit")
              soundManager?.playSound("glitch")
              state.running = false
              player.state = "dead"
              onGameOver(state.score)
              break
            }
          }
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i]
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.3
          p.life--
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1)
          }
        }
      }

      // Draw ground
      ctx!.fillStyle = "#00E8FF"
      ctx!.fillRect(0, GROUND_Y + player.height, canvas.width, 4)

      // Draw player
      drawPlayer(player.x, player.y, player.animationFrame, player.state)

      // Draw obstacles
      for (const obstacle of obstaclesRef.current) {
        ctx!.fillStyle = obstacle.type === "spike" ? "#FF3CF0" : "#00E8FF"
        if (obstacle.type === "spike") {
          const points = [
            [obstacle.x + obstacle.width / 2, obstacle.y],
            [obstacle.x + obstacle.width, obstacle.y + obstacle.height],
            [obstacle.x, obstacle.y + obstacle.height],
          ]
          ctx!.fillStyle = "#FF3CF0"
          ctx!.beginPath()
          ctx!.moveTo(points[0][0], points[0][1])
          ctx!.lineTo(points[1][0], points[1][1])
          ctx!.lineTo(points[2][0], points[2][1])
          ctx!.closePath()
          ctx!.fill()
        } else if (obstacle.type === "block") {
          ctx!.fillStyle = "#00E8FF"
          ctx!.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
          ctx!.strokeStyle = "#FF3CF0"
          ctx!.lineWidth = 2
          ctx!.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
        } else if (obstacle.type === "barrier") {
          ctx!.fillStyle = "rgba(255, 60, 240, 0.5)"
          ctx!.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
          for (let i = 0; i < obstacle.width; i += 10) {
            ctx!.strokeStyle = "#FF3CF0"
            ctx!.lineWidth = 2
            ctx!.strokeRect(obstacle.x + i, obstacle.y, 8, obstacle.height)
          }
        } else if (obstacle.type === "drone") {
          ctx!.fillStyle = "#FF3CF0"
          ctx!.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
          ctx!.fillStyle = "#00E8FF"
          ctx!.beginPath()
          ctx!.arc(obstacle.x + obstacle.width / 4, obstacle.y + obstacle.height / 2, 4, 0, Math.PI * 2)
          ctx!.fill()
          ctx!.beginPath()
          ctx!.arc(obstacle.x + (obstacle.width * 3) / 4, obstacle.y + obstacle.height / 2, 4, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      // Draw particles
      for (const particle of particlesRef.current) {
        ctx!.globalAlpha = particle.life / 100
        ctx!.fillStyle = particle.color
        ctx!.fillRect(particle.x, particle.y, 4, 4)
        ctx!.globalAlpha = 1
      }

      // Draw HUD - Retro 7-segment score display
      ctx!.fillStyle = "#FF3CF0"
      ctx!.font = "bold 32px monospace"
      ctx!.fillText(`SCORE: ${state.score}`, 20, 40)

      ctx!.font = "14px monospace"
      ctx!.fillStyle = "#00E8FF"
      ctx!.fillText(`SPEED: ${state.gameSpeed.toFixed(1)}x`, 20, 70)

      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    // Handle jump input
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && !player.isJumping && isGameActive) {
        player.velocityY = JUMP_STRENGTH
        player.isJumping = true
        soundManager?.playSound("jump")
        e.preventDefault()
      }
    }

    const handleTouchStart = () => {
      if (!player.isJumping && isGameActive) {
        player.velocityY = JUMP_STRENGTH
        player.isJumping = true
        soundManager?.playSound("jump")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    canvas.addEventListener("touchstart", handleTouchStart)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("keydown", handleKeyDown)
      canvas.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [isGameActive, onScore, onGameOver, onHighScore, soundManager])

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background relative">
      <canvas ref={canvasRef} className="w-full h-full block bg-gradient-to-b from-[#0A0A0A] to-[#1a0a2e] scanlines" />
      <div className="absolute top-4 left-4 text-neon-pink pixel-glow">
        <div className="text-sm font-mono">
          {">"} TAP/SPACE TO JUMP {"<"}
        </div>
      </div>
    </div>
  )
}
