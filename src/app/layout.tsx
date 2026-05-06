import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOALZONE - Portal Berita Sepak Bola Terkini",
  description: "Portal berita sepak bola terkini dengan liputan lengkap liga-liga top dunia. Live score, klasemen, transfer, dan analisis taktis.",
  keywords: ["sepak bola", "bola", "berita bola", "live score", "premier league", "champions league", "transfer", "klasemen"],
  authors: [{ name: "GOALZONE Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "GOALZONE - Portal Berita Sepak Bola",
    description: "Live score, klasemen, transfer, dan analisis taktis dari liga-liga top Eropa",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-deep-900 text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
