"use client"

import { useState, useEffect, useCallback } from "react"
import { TRexGame } from "@/components/trex-game"
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi"
import { recordScore, getBestScore } from "@/lib/contract"

export default function Home() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isMobileDevice, setIsMobileDevice] = useState(true)

  // Detect mobile
  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
    setIsMobileDevice(mobile)
  }, [])

  // Load best score when wallet connected
  const loadBestScore = useCallback(async () => {
    if (!address) return
    try {
      const best = await getBestScore(address)
      setBestScore(best)
    } catch (error) {
      console.error("Failed to load best score:", error)
    }
  }, [address])

  useEffect(() => {
    if (address) loadBestScore()
  }, [address, loadBestScore])

  // Game handlers
  const handleScore = useCallback((newScore: number) => setScore(newScore), [])
  const handleGameOver = useCallback(() => {
    setGameActive(false)
    setGameOver(true)
  }, [])

  const recordHighScoreOnChain = useCallback(
    async (finalScore: number) => {
      if (!address || !walletClient) throw new Error("Wallet not connected")
      try {
        await recordScore(walletClient, address, finalScore)
        await loadBestScore()
      } catch (error) {
        console.error("Error recording high score:", error)
        throw error
      }
    },
    [address, walletClient, loadBestScore]
  )

  // Wallet button
  const handleWalletClick = () => {
    if (isConnected) disconnect()
    else {
      const injected = connectors.find(c => c.id === "injected")
      if (injected) connect({ connector: injected })
    }
  }

  // Desktop warning
  if (!isMobileDevice && typeof window !== "undefined") {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-[#FCE38A] to-[#F38181] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-800">T-REX RUNNER</h1>
          <p className="text-lg text-gray-700">This game is optimized for mobile devices.</p>
          <p className="text-md text-gray-600">Please play on a mobile device or tablet for the best experience.</p>
          <div className="pt-4 text-sm text-gray-500">Detected: Desktop Device</div>
        </div>
      </div>
    )
  }

  // Game active
  if (gameActive) {
    return (
      <TRexGame
        onScore={handleScore}
        onGameOver={handleGameOver}
        highScore={bestScore}
        recordHighScoreOnChain={recordHighScoreOnChain}
      />
    )
  }

  // Main menu / post-game
  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#FCE38A] to-[#F38181] flex flex-col items-center justify-center px-4 overflow-hidden touch-none">
      <button
        onClick={handleWalletClick}
        className="fixed top-4 right-4 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF3B3B] hover:from-[#FF5555] hover:to-[#FF2525] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm z-50"
        title={isConnected ? "Disconnect wallet" : "Connect your wallet"}
      >
        🔗 {isConnected ? "Connected" : "Wallet"}
      </button>

      <div className="w-full space-y-6 text-center max-w-md mx-auto">
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800">T-REX RUNNER</h1>
          <p className="text-lg md:text-xl text-gray-700">Jump • Survive • Score High</p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-6">
          <div className="bg-white/80 p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-orange-600">{score}</div>
            <div className="text-xs text-gray-600">Score</div>
          </div>
          <div className="bg-white/80 p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-amber-600">{bestScore}</div>
            <div className="text-xs text-gray-600">Best</div>
          </div>
        </div>

        {!gameActive && !gameOver && (
          <button
            onClick={() => {
              setScore(0)
              setGameActive(true)
              setGameOver(false)
              setSubmitMessage("")
            }}
            className="w-full max-w-xs mx-auto py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg font-bold rounded-lg shadow-lg transition-all active:scale-95"
          >
            START GAME
          </button>
        )}

        {gameOver && (
          <div className="space-y-4 py-6">
            <div className="bg-white/90 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">GAME OVER</h2>
              <p className="text-xl font-bold text-orange-600 mb-3">Score: {score}</p>
              {score > bestScore && <p className="text-lg font-bold text-amber-600 mb-4">NEW HIGH SCORE!</p>}
            </div>

            {score > bestScore && isConnected && (
              <button
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    await recordHighScoreOnChain(score)
                    setSubmitMessage("Score submitted to blockchain!")
                  } catch {
                    setSubmitMessage("Failed to submit. Try again.")
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting}
                className="w-full max-w-xs mx-auto py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all active:scale-95"
              >
                {isSubmitting ? "SUBMITTING..." : "SAVE TO BLOCKCHAIN"}
              </button>
            )}

            {submitMessage && <p className="text-sm text-center text-gray-700 font-semibold">{submitMessage}</p>}

            <button
              onClick={() => {
                setGameOver(false)
                setScore(0)
              }}
              className="w-full max-w-xs mx-auto py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg font-bold rounded-lg shadow-lg transition-all active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        <div className="pt-6 border-t border-orange-300">
          <p className="text-xs text-gray-700">Tap the screen or press SPACE to jump</p>
        </div>
      </div>
    </div>
  )
}
