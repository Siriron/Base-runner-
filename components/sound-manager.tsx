"use client"

import type React from "react"

import { useSoundManager } from "@/hooks/use-sound"
import { Volume2, VolumeX } from "lucide-react"

export const SoundManager: React.FC = () => {
  const { isMuted, toggleMute, updateVolume, volume } = useSoundManager()

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 z-50 bg-card/80 p-3 rounded border border-primary">
      <button
        onClick={toggleMute}
        className="text-accent hover:text-secondary transition-colors"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={isMuted ? 0 : volume * 100}
        onChange={(e) => updateVolume(Number.parseInt(e.target.value) / 100)}
        className="w-24 h-1 bg-primary/30 rounded-lg appearance-none cursor-pointer"
        disabled={isMuted}
      />
      <span className="text-xs text-muted-foreground min-w-8">{Math.round(volume * 100)}%</span>
    </div>
  )
}
