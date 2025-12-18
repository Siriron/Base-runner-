"use client";

import { ReactNode } from "react";
import { createConfig, WagmiConfig, mainnet, configureChains, publicProvider } from "wagmi";
import "@/styles/globals.css"; // your tailwind/globals

// Define chains
const chains = [mainnet];

// Configure public client
const { publicClient, webSocketPublicClient } = configureChains(chains, [publicProvider()]);

// Create Wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
      </body>
    </html>
  );
}
