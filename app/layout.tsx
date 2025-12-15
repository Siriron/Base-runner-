import type { Metadata } from "next"
import "./globals.css"

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
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
