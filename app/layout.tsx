import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  weight: "400",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Personalized Art Builder",
  description: "Create personalized artwork from a library of draggable elements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${patrickHand.variable} antialiased`}>{children}</body>
    </html>
  );
}
