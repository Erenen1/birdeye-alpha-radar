import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,          // prevent iOS auto-zoom on inputs
  userScalable: false,
  themeColor: "#0d1117",    // matches --background, colors browser chrome on Android
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Birdeye Sentinel — Solana Token Radar",
  description:
    "Real-time AI-powered Solana token discovery. Spot alpha before it goes viral with Birdeye Sentinel's ML scoring engine.",
  keywords: ["Solana", "DeFi", "token radar", "alpha", "birdeye", "crypto"],
  authors: [{ name: "Birdeye Sentinel" }],
  robots: "index, follow",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Birdeye Sentinel — Solana Token Radar",
    description: "Real-time AI-powered Solana token discovery. Spot alpha before it goes viral.",
    type: "website",
    siteName: "Birdeye Sentinel",
  },
  twitter: {
    card: "summary",
    title: "Birdeye Sentinel — Solana Token Radar",
    description: "Real-time AI-powered Solana token discovery.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
