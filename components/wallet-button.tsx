"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { injected } from "wagmi/connectors"

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <button
      onClick={() => (isConnected ? disconnect() : handleConnect())}
      className="px-4 py-2 bg-neon-pink text-background font-mono font-bold rounded border-2 border-neon-pink hover:bg-background hover:text-neon-pink transition-colors pixel-glow"
    >
      {isConnected ? truncateAddress(address || "") : "Connect Wallet"}
    </button>
  )
}
