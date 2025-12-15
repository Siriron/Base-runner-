"use client"

import { useEffect, useRef, useState } from "react"

interface SoundInstance {
  audio: HTMLAudioElement
  isPlaying: boolean
}

export function useSound(soundFile: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const audio = new Audio(soundFile)
    audio.crossOrigin = "anonymous"

    audio.addEventListener("canplaythrough", () => {
      setIsLoaded(true)
    })

    audioRef.current = audio

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [soundFile])

  const play = () => {
    if (audioRef.current && isLoaded) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => console.log("Audio play failed:", err))
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
  }

  return { play, stop, setVolume, isLoaded }
}

export function useSoundManager() {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)

  const jump = useSound("/sounds/jump.wav")
  const land = useSound("/sounds/land.wav")
  const hit = useSound("/sounds/hit.wav")
  const highScore = useSound("/sounds/highscore.wav")
  const blip = useSound("/sounds/blip.wav")
  const point = useSound("/sounds/point.wav")
  const glitch = useSound("/sounds/glitch.wav")
  const hum = useSound("/sounds/hum.mp3")

  const sounds = { jump, land, hit, highScore, blip, point, glitch, hum }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    Object.values(sounds).forEach((sound) => {
      sound.setVolume(isMuted ? volume : 0)
    })
  }

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume)
    if (!isMuted) {
      Object.values(sounds).forEach((sound) => {
        sound.setVolume(newVolume)
      })
    }
  }

  const playSound = (soundKey: keyof typeof sounds) => {
    if (!isMuted) {
      sounds[soundKey].play()
    }
  }

  return {
    sounds,
    isMuted,
    toggleMute,
    updateVolume,
    playSound,
    volume,
  }
}
