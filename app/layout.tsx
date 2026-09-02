import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#080807",
};

export const metadata: Metadata = {
  title: "TAPESY | Gospel Music & AI Lyrics",
  description: "Discover, upload, and worship with TAPESY. The retro-styled gospel music platform featuring AI-powered lyric transcription for every song.",
  keywords: ["gospel music", "christian music", "lyrics", "ai transcription", "worship", "retro music player"],
  authors: [{ name: "TAPESY" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[#080807] text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}