"use client"

import { useEffect, useRef, useState } from "react"

const SOUND_URLS = {
  click: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_5c1ab05d53.mp3?filename=click-124467.mp3",
  spawn: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_c7e8bde89f.mp3?filename=pop-94319.mp3",
  success: "https://cdn.pixabay.com/download/audio/2022/10/30/audio_4c2aaca5c7.mp3?filename=ui-success-1-204500.mp3",
}

interface AudioInstance {
  audio: HTMLAudioElement
  isPlaying: boolean
}

export function useGameAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioInstancesRef = useRef<Record<string, AudioInstance>>({})
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume().then(() => {
          setAudioUnlocked(true)
        })
      } else {
        setAudioUnlocked(true)
      }

      // Preload all sounds
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        if (!audioInstancesRef.current[key]) {
          const audio = new Audio(url)
          audio.crossOrigin = "anonymous"
          audio.volume = 0.6
          audioInstancesRef.current[key] = { audio, isPlaying: false }
        }
      })

      document.removeEventListener("click", unlockAudio)
      document.removeEventListener("touchstart", unlockAudio)
    }

    document.addEventListener("click", unlockAudio)
    document.addEventListener("touchstart", unlockAudio)

    return () => {
      document.removeEventListener("click", unlockAudio)
      document.removeEventListener("touchstart", unlockAudio)
    }
  }, [])

  const playSound = (soundKey: keyof typeof SOUND_URLS, volume = 0.6) => {
    if (!audioUnlocked) return

    const instance = audioInstancesRef.current[soundKey]
    if (instance) {
      instance.audio.volume = volume
      instance.audio.currentTime = 0

      if (instance.isPlaying) {
        instance.audio.pause()
      }

      instance.isPlaying = true
      instance.audio.play().catch(() => {
        instance.isPlaying = false
      })

      instance.audio.onended = () => {
        instance.isPlaying = false
      }
    }
  }

  return { playSound, audioUnlocked }
}
