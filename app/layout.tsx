// app/layout.tsx
"use client"

import { ReactNode } from "react"
import { WagmiConfig, createConfig, configureChains, mainnet } from "wagmi"
import { publicProvider } from "wagmi/providers/public"
import "@/styles/globals.css" // your tailwind/globals

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
)

const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
      </body>
    </html>
  )
}
