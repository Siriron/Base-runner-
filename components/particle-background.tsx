"use client"

import type React from "react"

import { useEffect, useRef } from "react"

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    const particles: Array<{
      x: number
      y: number
      size: number
      vx: number
      vy: number
      opacity: number
      fadeSpeed: number
    }> = []

    // Create initial particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        fadeSpeed: Math.random() * 0.01 + 0.005,
      })
    }

    let animationId: number
    const animate = () => {
      ctx!.fillStyle = "rgba(10, 10, 10, 0.1)"
      ctx!.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.opacity -= particle.fadeSpeed

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Respawn if faded
        if (particle.opacity <= 0) {
          particle.opacity = Math.random() * 0.5 + 0.3
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
        }

        ctx!.globalAlpha = particle.opacity
        ctx!.fillStyle = "#FF3CF0"
        ctx!.fillRect(particle.x, particle.y, particle.size, particle.size)
      })

      ctx!.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
}
