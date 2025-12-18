"use client";

import { ReactNode } from "react";
import "@/styles/globals.css";

// Fixed imports for wagmi v2
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";

// 1. Configure chains
const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

// 2. Set up default wallets (RainbowKit)
const { connectors } = getDefaultWallets({
  appName: "Base Runner",
  chains,
});

// 3. Create Wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
