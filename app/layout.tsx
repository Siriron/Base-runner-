import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "BaseRunner – On-Chain Pixel Runner",
  description:
    "BaseRunner is an on-chain endless runner game blending classic pixel gameplay with modern Web3 mechanics on Base.",
  applicationName: "BaseRunner",
  authors: [{ name: "BaseRunner Team" }],
  keywords: [
    "Base",
    "Web3 Game",
    "On-chain Game",
    "Endless Runner",
    "Blockchain Gaming",
    "Pixel Game",
  ],
}

// ✅ FIX for Next.js 16 viewport warning
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
