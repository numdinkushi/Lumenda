import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "@/contexts/wallet-context";
import { BackgroundByRoute } from "@/components/layout/background-by-route";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumenda | Remittance on Stacks",
  description: "Send money globally with low fees on the Stacks blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <div className="relative min-h-screen">
            <BackgroundByRoute />
            <div className="relative z-10">{children}</div>
          </div>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
