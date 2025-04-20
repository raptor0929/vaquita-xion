"use client";
import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import './globals.css'
import {AbstraxionProvider} from "@burnt-labs/abstraxion";

import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";

const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: "Xion Cow Savings Protocol",
//   description: "A DeFi savings protocol with CosmWasm integration"
// }

const treasuryConfig = {
  treasury: "xion1gu5kdeglgpy76pfxy5g9ckaf8wen7esjyz8yvy3wv6x87h3r0s0q3ps72s",
  rpcUrl: "https://rpc.xion-testnet-2.burnt.com/",
  restUrl: "https://api.xion-testnet-2.burnt.com/"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AbstraxionProvider
          config={treasuryConfig}>
          {children}
        </AbstraxionProvider>
      </body>
    </html>
  )
}