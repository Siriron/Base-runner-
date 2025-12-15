import { publicClient } from "./viem-client"

export const CONTRACT_ADDRESS = "0xa231a4b3e02ec0e3255e6aa7ca2c4b7c1742aae4"
export { publicClient }

export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "score", type: "uint256" }],
    name: "recordScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "bestScore",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "sessionCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
    ],
    name: "NewHighScore",
    type: "event",
  },
] as const

export const recordScore = async (walletClient: any, account: any, score: number) => {
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "recordScore",
      args: [BigInt(score)],
      account,
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return receipt
  } catch (error) {
    console.error("Error recording score:", error)
    throw error
  }
}

export const getBestScore = async (address: string) => {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "bestScore",
      args: [address as any],
    })
    return Number(result)
  } catch (error) {
    console.error("Error fetching best score:", error)
    return 0
  }
}

export const getSessionCount = async (address: string) => {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "sessionCount",
      args: [address as any],
    })
    return Number(result)
  } catch (error) {
    console.error("Error fetching session count:", error)
    return 0
  }
}
