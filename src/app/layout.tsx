import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APP_NAME } from "@/lib/market/defaults";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Private group prediction markets — IOUs, bets, and who reads the room best.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
