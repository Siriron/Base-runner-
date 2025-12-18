"use client";

import { ReactNode } from "react";
import { createClient, WagmiProvider } from "wagmi";
import { mainnet } from "viem/chains";
import "@/styles/globals.css";

// Create Wagmi client
const wagmiClient = createClient({
  autoConnect: true,
  chain: mainnet,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider client={wagmiClient}>{children}</WagmiProvider>
      </body>
    </html>
  );
}
