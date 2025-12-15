"use client"

import { useState, useEffect, useRef } from "react"

interface TRexGameProps {
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
  highScore: number
  recordHighScoreOnChain: (score: number) => Promise<void>
}

export function TRexGame({ onScore, onGameOver, highScore, recordHighScoreOnChain }: TRexGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioUnlockedRef = useRef(false)

  // Sound URLs - extended with day/night ambient sounds
  const SOUNDS = {
    jump: "https://www.soundjay.com/button/sounds/button-16.mp3",
    collision: "https://www.soundjay.com/button/sounds/button-10.mp3",
    point: "https://www.soundjay.com/button/sounds/button-3.mp3",
    dayWind: "https://www.soundjay.com/nature/sounds/desert-wind-1.mp3",
    nightCrickets: "https://www.soundjay.com/nature/sounds/crickets-1.mp3",
  }

  const audioInstancesRef = useRef<{ [key: string]: HTMLAudioElement }>({})
  const [gameState, setGameState] = useState<"day" | "night">("day")

  const unlockAudio = () => {
    if (!audioUnlockedRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioUnlockedRef.current = true

      Object.entries(SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url)
        audio.preload = "auto"
        audio.loop = key === "dayWind" || key === "nightCrickets"
        audio.volume = key === "dayWind" || key === "nightCrickets" ? 0.1 : 0.3
        audioInstancesRef.current[key] = audio
      })
    }
  }

  const playSound = (soundType: keyof typeof SOUNDS) => {
    if (!audioUnlockedRef.current) return
    const audio = audioInstancesRef.current[soundType]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {})
    }
  }

  const stopSound = (soundType: keyof typeof SOUNDS) => {
    const audio = audioInstancesRef.current[soundType]
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const GAME_SPEED = 6
    const GRAVITY = 0.7
    const JUMP_FORCE = -12
    const GROUND_Y = canvas.height - 100
    const TREX_WIDTH = 50
    const TREX_HEIGHT = 50

    // Game state
    const tRexX = 60
    let tRexY = GROUND_Y
    let jumpVelocity = 0
    let isJumping = false
    let isDucking = false
    let score = 0
    let gameActive = true
    let gameSpeed = GAME_SPEED
    let obstacleSpawnCounter = 0
    let obstacleSpawnRate = 160
    let animationFrame = 0
    let tRexBobOffset = 0
    let ambientSoundPlaying = false
    let currentDayNight: "day" | "night" = "day"

    interface Obstacle {
      x: number
      width: number
      height: number
      type: "cactus" | "rock" | "flying"
      wingOffset?: number
    }

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      maxLife: number
      type: "dust" | "spark"
    }

    const obstacles: Obstacle[] = []
    const particles: Particle[] = []

    const drawBackground = () => {
      const timeInSeconds = animationFrame / 60
      const dayNightCycle = (Math.sin(timeInSeconds * 0.05) + 1) / 2

      if (dayNightCycle > 0.5) {
        currentDayNight = "day"
        // Day gradient: warm desert
        const dayGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        dayGradient.addColorStop(0, "#FCE38A")
        dayGradient.addColorStop(0.5, "#F38181")
        dayGradient.addColorStop(1, "#FFDDA1")
        ctx.fillStyle = dayGradient
      } else {
        currentDayNight = "night"
        // Night gradient: dark starry sky
        const nightGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        nightGradient.addColorStop(0, "#0D1B2A")
        nightGradient.addColorStop(0.5, "#1B263B")
        nightGradient.addColorStop(1, "#415A77")
        ctx.fillStyle = nightGradient
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const mountainOffset = (animationFrame * gameSpeed * 0.3) % canvas.width
      ctx.fillStyle = "rgba(217, 176, 140, 0.3)"
      ctx.beginPath()
      ctx.moveTo(0, canvas.height * 0.6)
      for (let i = 0; i < 5; i++) {
        const x = (i * canvas.width * 0.25 - mountainOffset) % (canvas.width * 1.5)
        ctx.lineTo(x, canvas.height * 0.45)
        ctx.lineTo(x + canvas.width * 0.125, canvas.height * 0.6)
      }
      ctx.fill()

      if (currentDayNight === "night") {
        ctx.fillStyle = "rgba(176, 224, 230, 0.8)"
        for (let i = 0; i < 50; i++) {
          const x = (i * 73 + animationFrame * 0.1) % canvas.width
          const y = (i * 137) % (canvas.height * 0.5)
          const brightness = 0.3 + Math.sin(animationFrame * 0.05 + i) * 0.5
          ctx.globalAlpha = brightness
          ctx.fillRect(x, y, 2, 2)
        }
        ctx.globalAlpha = 1

        ctx.fillStyle = "#F0E68C"
        ctx.shadowColor = "rgba(240, 230, 140, 0.8)"
        ctx.shadowBlur = 40
        ctx.beginPath()
        ctx.arc(canvas.width * 0.85, canvas.height * 0.2, 40, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowColor = "transparent"
      }

      if (currentDayNight === "day") {
        ctx.fillStyle = "#F6A85F"
      } else {
        ctx.fillStyle = "#5C4A32"
      }
      ctx.fillRect(0, GROUND_Y + TREX_HEIGHT, canvas.width, canvas.height - GROUND_Y - TREX_HEIGHT)

      ctx.strokeStyle = currentDayNight === "day" ? "#D4842F" : "#3C2A1C"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, GROUND_Y + TREX_HEIGHT)
      ctx.lineTo(canvas.width, GROUND_Y + TREX_HEIGHT)
      ctx.stroke()

      if (!ambientSoundPlaying && audioUnlockedRef.current) {
        ambientSoundPlaying = true
        if (currentDayNight === "day") {
          stopSound("nightCrickets")
          playSound("dayWind")
        } else {
          stopSound("dayWind")
          playSound("nightCrickets")
        }
      }
    }

    const drawTRex = () => {
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
      ctx.ellipse(tRexX + TREX_WIDTH / 2, GROUND_Y + TREX_HEIGHT + 8, TREX_WIDTH / 2, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      // T-Rex body with gradient
      const gradient = ctx.createLinearGradient(tRexX, tRexY, tRexX + TREX_WIDTH, tRexY + TREX_HEIGHT)
      gradient.addColorStop(0, "#FFB347")
      gradient.addColorStop(1, "#FFCC33")
      ctx.fillStyle = gradient
      ctx.fillRect(tRexX, tRexY, TREX_WIDTH, TREX_HEIGHT)

      // T-Rex eye
      ctx.fillStyle = "#000"
      ctx.beginPath()
      ctx.arc(tRexX + 35, tRexY + 15, 5, 0, Math.PI * 2)
      ctx.fill()

      // T-Rex tail if ducking
      if (isDucking) {
        ctx.strokeStyle = "#FFCC33"
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.moveTo(tRexX + 15, tRexY + 35)
        ctx.quadraticCurveTo(tRexX + 5, tRexY + 40, tRexX - 5, tRexY + 35)
        ctx.stroke()
      }
    }

    const spawnParticles = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + Math.random() * 20 - 10,
          y: y,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 2 + 1,
          life: 0,
          maxLife: 30,
          type: "dust",
        })
      }
    }

    const updateParticles = () => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3 // gravity

        const alpha = 1 - p.life / p.maxLife
        ctx.globalAlpha = alpha
        ctx.fillStyle = "#D4842F"
        ctx.fillRect(p.x, p.y, 4, 4)

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
        }
      }
      ctx.globalAlpha = 1
    }

    // Jump handler
    const jump = () => {
      if (!isJumping && !isDucking && gameActive) {
        jumpVelocity = JUMP_FORCE
        isJumping = true
        playSound("jump")
        spawnParticles(tRexX + TREX_WIDTH / 2, tRexY + TREX_HEIGHT, 8)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        jump()
      }
      if (e.code === "ArrowDown") {
        isDucking = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        isDucking = false
      }
    }

    const handleMouseDown = () => {
      unlockAudio()
      jump()
    }

    const handleTouchStart = () => {
      unlockAudio()
      jump()
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Game loop
    const gameLoop = () => {
      if (!gameActive) {
        requestAnimationFrame(gameLoop)
        return
      }

      drawBackground()

      if (isJumping) {
        jumpVelocity += GRAVITY
        tRexY += jumpVelocity

        if (tRexY >= GROUND_Y) {
          tRexY = GROUND_Y
          isJumping = false
          jumpVelocity = 0
          spawnParticles(tRexX + TREX_WIDTH / 2, tRexY + TREX_HEIGHT, 6)
        }
      } else {
        // Running bobbing animation
        tRexBobOffset = Math.sin(animationFrame * 0.08) * 4
        tRexY = GROUND_Y + tRexBobOffset
      }

      drawTRex()
      updateParticles()

      obstacleSpawnCounter++
      if (obstacleSpawnCounter > obstacleSpawnRate) {
        const obstacleType = Math.random()
        let newObstacle: Obstacle

        if (obstacleType < 0.5) {
          // Cactus (50%)
          newObstacle = {
            x: canvas.width,
            width: 25,
            height: Math.random() * 30 + 50,
            type: "cactus",
          }
        } else if (obstacleType < 0.75) {
          // Rock (25%)
          newObstacle = {
            x: canvas.width,
            width: 40,
            height: 30,
            type: "rock",
          }
        } else {
          // Flying dinosaur (25%)
          newObstacle = {
            x: canvas.width,
            width: 50,
            height: 35,
            type: "flying",
            wingOffset: 0,
          }
        }

        obstacles.push(newObstacle)
        playSound("point")
        obstacleSpawnCounter = 0
        obstacleSpawnRate = Math.max(60, obstacleSpawnRate - 1)
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i]
        obstacle.x -= gameSpeed

        if (obstacle.type === "cactus") {
          const cactuGradient = ctx.createLinearGradient(
            obstacle.x,
            GROUND_Y - obstacle.height,
            obstacle.x + obstacle.width,
            GROUND_Y,
          )
          cactuGradient.addColorStop(0, "#2E8B57")
          cactuGradient.addColorStop(1, "#006400")
          ctx.fillStyle = cactuGradient
          ctx.fillRect(obstacle.x, GROUND_Y - obstacle.height, obstacle.width, obstacle.height)

          // Spikes
          ctx.fillStyle = "#00AA00"
          for (let j = 0; j < 3; j++) {
            ctx.fillRect(obstacle.x - 6, GROUND_Y - obstacle.height + j * 15, 8, 10)
            ctx.fillRect(obstacle.x + obstacle.width - 2, GROUND_Y - obstacle.height + j * 15, 8, 10)
          }
        } else if (obstacle.type === "rock") {
          const rockGradient = ctx.createLinearGradient(
            obstacle.x,
            GROUND_Y - obstacle.height,
            obstacle.x + obstacle.width,
            GROUND_Y,
          )
          rockGradient.addColorStop(0, "#A9A9A9")
          rockGradient.addColorStop(1, "#696969")
          ctx.fillStyle = rockGradient
          ctx.fillRect(obstacle.x, GROUND_Y - obstacle.height, obstacle.width, obstacle.height)
        } else if (obstacle.type === "flying") {
          obstacle.wingOffset = (obstacle.wingOffset || 0) + 0.3
          const wingFlap = Math.sin(obstacle.wingOffset) * 5

          // Body
          const flyingGradient = ctx.createLinearGradient(
            obstacle.x,
            GROUND_Y - obstacle.height,
            obstacle.x + obstacle.width,
            GROUND_Y,
          )
          flyingGradient.addColorStop(0, "#8B4513")
          flyingGradient.addColorStop(1, "#A0522D")
          ctx.fillStyle = flyingGradient
          ctx.fillRect(obstacle.x + 15, GROUND_Y - obstacle.height + 10, 20, 15)

          // Wings with glow
          ctx.shadowColor = "rgba(139, 69, 19, 0.6)"
          ctx.shadowBlur = 15
          ctx.beginPath()
          ctx.moveTo(obstacle.x + 15, GROUND_Y - obstacle.height + 17)
          ctx.lineTo(obstacle.x + 10 - wingFlap, GROUND_Y - obstacle.height + 20)
          ctx.lineTo(obstacle.x + 10 - wingFlap, GROUND_Y - obstacle.height + 10)
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(obstacle.x + 35, GROUND_Y - obstacle.height + 17)
          ctx.lineTo(obstacle.x + 40 + wingFlap, GROUND_Y - obstacle.height + 20)
          ctx.lineTo(obstacle.x + 40 + wingFlap, GROUND_Y - obstacle.height + 10)
          ctx.fill()
          ctx.shadowColor = "transparent"
        }

        const collisionPadding = 10
        if (
          tRexX + collisionPadding < obstacle.x + obstacle.width &&
          tRexX + TREX_WIDTH - collisionPadding > obstacle.x &&
          tRexY + collisionPadding < GROUND_Y &&
          tRexY + TREX_HEIGHT - collisionPadding > GROUND_Y - obstacle.height
        ) {
          gameActive = false
          playSound("collision")
          setIsGameOver(true)
          onGameOver(score)

          if (score > highScore) {
            recordHighScoreOnChain(score).catch(console.error)
          }
        }

        if (obstacle.x + obstacle.width < 0) {
          obstacles.splice(i, 1)
          score++
          setCurrentScore(score)
          onScore(score)
        }
      }

      ctx.globalAlpha = 1
      const screenWidth = canvas.width
      const screenHeight = canvas.height

      // Draw lives (hearts) in top-left
      ctx.fillStyle = "#333"
      const heartSize = 16
      const heartPadding = 8
      const lives = 3 // You can make this dynamic if needed
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i < lives ? "#444" : "#CCC"
        // Simple pixelated heart shape
        ctx.fillRect(20 + i * (heartSize + heartPadding), 20, heartSize, heartSize)
      }

      // Draw score display in top-right with large monospace font
      ctx.font = "bold 48px 'Courier New', monospace"
      ctx.fillStyle = "#333"
      const scoreText = String(score).padStart(6, "0")
      const hiScoreText = String(highScore).padStart(6, "0")
      const scoreX = screenWidth - 180
      ctx.fillText(scoreText, scoreX, 60)

      ctx.font = "bold 24px 'Courier New', monospace"
      ctx.fillStyle = "#999"
      ctx.fillText("HI " + hiScoreText, scoreX, 95)

      canvas.style.backgroundColor = "#F5E6D3"

      const timeInSeconds = animationFrame / 60
      gameSpeed = GAME_SPEED + timeInSeconds * 0.05

      animationFrame++
      requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("resize", resizeCanvas)
      stopSound("dayWind")
      stopSound("nightCrickets")
    }
  }, [highScore, onScore, onGameOver, recordHighScoreOnChain])

  const handleRestart = () => {
    setIsGameOver(false)
    setCurrentScore(0)
    window.location.reload()
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Improved game over modal with better mobile responsiveness */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-30 touch-none">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center space-y-6 max-w-sm w-full mx-auto">
            <h2 className="text-4xl font-bold text-gray-800">GAME OVER</h2>
            <div className="text-3xl font-bold text-orange-500">Score: {currentScore}</div>
            {currentScore > highScore && (
              <div className="text-xl font-bold text-yellow-600 animate-pulse">NEW HIGH SCORE! Submitting...</div>
            )}
            <button
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-lg py-6 font-bold rounded-lg transition-all active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
