"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { TRexGame } from "@/components/trex-game"
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

  const handleScore = (newScore: number) => {
    setScore(newScore)
  }

  const handleGameOver = () => {
    setGameActive(false)
    setGameOver(true)
  }

  const recordHighScoreOnChain = async (finalScore: number) => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected")
    }
    await recordScore(walletClient, address, finalScore)
    await loadBestScore()
  }

  const loadBestScore = async () => {
    if (!address) return
    const best = await getBestScore(address)
    setBestScore(best)
  }

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect()
    } else {
      const injectedConnector = connectors.find(c => c.id === "injected")
      if (injectedConnector) connect({ connector: injectedConnector })
    }
  }

  // Desktop block
  if (!isMobileDevice) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-[#F
