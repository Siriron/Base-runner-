"use client"

import { useState, useEffect } from "react"
import TRexGame from "@/components/trex-game"
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi"
import { recordScore, getBestScore } from "@/lib/contract"

export default function Home() {
  const [gameActive, setGameActive] = useState(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isMobileDevice, setIsMobileDevice] = useState(true)

  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    const isMobile =
      /iPhone|iPad|iPod|Android|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    setIsMobileDevice(isMobile)
  }, [])

  useEffect(() => {
    if (address) loadBestScore()
  }, [address])

  const handleScore = (newScore: number) => setScore(newScore)

  const handleGameOver = () => {
    setGameActive(false)
    setGameOver(true)
  }

  const recordHighScoreOnChain = async (finalScore: number) => {
    if (!address || !walletClient) throw new Error("Wallet not connected")
    try {
      await recordScore(walletClient, address, finalScore)
      await loadBestScore()
      setSubmitMessage("Score submitted to blockchain!")
    } catch (error) {
      console.error(error)
      setSubmitMessage("Failed to submit. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadBestScore = async () => {
    if (!address) return
    const best = await getBestScore(address)
    setBestScore(best)
  }

  const handleWalletClick = () => {
    if (isConnected) disconnect()
    else {
      const injectedConnector = connectors.find(c => c.id === "injected")
      if (injectedConnector) connect({ connector: injectedConnector })
    }
  }

  // Desktop warning
  if (!isMobileDevice) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-center bg-gradient-to-b from-[#FCE38A] to-[#F38181] px-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">T-REX RUNNER</h1>
          <p className="mt-4 text-lg text-gray-700">
            This game is optimized for mobile devices.
          </p>
        </div>
      </div>
    )
  }

  // Render game
  if (gameActive) {
    return (
      <TRexGame
        highScore={bestScore}
        onScore={handleScore}
        onGameOver={handleGameOver}
        recordHighScoreOnChain={recordHighScoreOnChain}
      />
    )
  }

  // Menu / start game
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-[#FCE38A] to-[#F38181] overflow-hidden">
      <button
        onClick={handleWalletClick}
        className="fixed top-4 right-4 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF3B3B] text-white font-bold rounded-full shadow-lg z-50"
      >
        {isConnected ? "Connected 🔗" : "Connect Wallet 🔗"}
      </button>

      <h1 className="text-5xl font-bold text-gray-800 mb-6">T-REX RUNNER</h1>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/80 p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-orange-600">{score}</div>
          <div className="text-xs text-gray-600">Score</div>
        </div>
        <div className="bg-white/80 p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-amber-600">{bestScore}</div>
          <div className="text-xs text-gray-600">Best</div>
        </div>
      </div>

      {!gameOver && (
        <button
          onClick={() => {
            setScore(0)
            setGameActive(true)
            setGameOver(false)
            setSubmitMessage("")
          }}
          className="py-4 px-6 bg-orange-500 text-white font-bold rounded-lg shadow-lg mb-4"
        >
          START GAME
        </button>
      )}

      {gameOver && (
        <div className="space-y-4">
          <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">GAME OVER</h2>
            <p className="text-xl font-bold text-orange-600 mb-3">Score: {score}</p>
            {score > bestScore && <p className="text-lg font-bold text-amber-600 mb-4">NEW HIGH SCORE!</p>}
          </div>

          {score > bestScore && isConnected && (
            <button
              onClick={() => {
                setIsSubmitting(true)
                recordHighScoreOnChain(score)
              }}
              disabled={isSubmitting}
              className="w-full max-w-xs mx-auto py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all active:scale-95"
            >
              {isSubmitting ? "SUBMITTING..." : "SAVE TO BLOCKCHAIN"}
            </button>
          )}

          {submitMessage && <p className="text-sm text-center text-gray-700 font-semibold">{submitMessage}</p>}

          <button
            onClick={() => { setGameOver(false); setScore(0) }}
            className="py-4 px-6 bg-orange-500 text-white font-bold rounded-lg shadow-lg"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}
