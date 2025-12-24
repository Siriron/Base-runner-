"use client";

import { ReactNode } from "react";
import "@/styles/globals.css";

import { WagmiConfig, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { createPublicClient, http } from "viem";

import {
  RainbowKitProvider,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";

// Create viem public client (REQUIRED)
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Wallet connectors
const { connectors } = getDefaultWallets({
  appName: "Base Runner",
  chains: [mainnet],
});

// Wagmi v2 config
const wagmiConfig = createConfig({
  connectors,
  publicClient,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={[mainnet]}>
            {children}
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
