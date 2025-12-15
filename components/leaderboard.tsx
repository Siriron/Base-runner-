"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { publicClient, CONTRACT_ADDRESS } from "@/lib/contract"
import { Button } from "@/components/ui/button"

interface LeaderboardEntry {
  address: string
  score: number
  timestamp: string
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"score" | "recent">("score")
  const [error, setError] = useState("")

  const loadLeaderboard = async () => {
    setLoading(true)
    setError("")
    try {
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: {
          name: "NewHighScore",
          inputs: [
            { indexed: true, name: "player", type: "address" },
            { indexed: false, name: "score", type: "uint256" },
          ],
        },
        fromBlock: "earliest",
        toBlock: "latest",
      } as any)

      const leaderboardMap = new Map<string, { score: number; timestamp: string }>()

      logs.forEach((log: any) => {
        const address = log.args.player
        const score = Number(log.args.score)

        if (!leaderboardMap.has(address) || leaderboardMap.get(address)!.score < score) {
          leaderboardMap.set(address, {
            score,
            timestamp: new Date(Number(log.blockNumber) * 1000).toISOString(),
          })
        }
      })

      const entries = Array.from(leaderboardMap, ([address, data]) => ({
        address,
        ...data,
      }))

      if (sortBy === "score") {
        entries.sort((a, b) => b.score - a.score)
      } else {
        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }

      setEntries(entries.slice(0, 100))
    } catch (err) {
      console.error("Error loading leaderboard:", err)
      setError("Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [sortBy])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-4 p-6 border-2 border-primary rounded">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-secondary pixel-glow">LEADERBOARD</h2>
          <Button
            onClick={loadLeaderboard}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs bg-transparent"
          >
            {loading ? "LOADING..." : "REFRESH"}
          </Button>
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setSortBy("score")}
            variant={sortBy === "score" ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            HIGHEST SCORES
          </Button>
          <Button
            onClick={() => setSortBy("recent")}
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            MOST RECENT
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Leaderboard table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-accent border-b border-primary">
              <tr>
                <th className="px-2 py-2 w-12">RANK</th>
                <th className="px-2 py-2">ADDRESS</th>
                <th className="px-2 py-2 text-right">SCORE</th>
                <th className="px-2 py-2 text-right w-24">DATE</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
                    No scores yet. Be the first to play!
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr
                    key={`${entry.address}-${idx}`}
                    className="border-b border-primary/30 hover:bg-primary/10 transition-colors"
                  >
                    <td className="px-2 py-2 font-bold text-secondary">#{idx + 1}</td>
                    <td className="px-2 py-2 font-mono text-xs text-accent">
                      {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-primary">{entry.score}</td>
                    <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Built from on-chain NewHighScore events • Updates may take a few seconds
        </p>
      </div>
    </div>
  )
}
