import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── Site URL (single source of truth) ───────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://goalzone.vercel.app'

// ─── SEO Metadata ────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GOALZONE - Portal Berita Sepak Bola Terkini",
    template: "%s | GOALZONE",
  },
  description: "Portal berita sepak bola terkini dengan liputan lengkap liga-liga top dunia. Live score, klasemen, transfer, dan analisis taktis.",
  keywords: [
    "sepak bola", "bola", "berita bola", "live score",
    "premier league", "champions league", "la liga", "serie a",
    "transfer", "klasemen", "hasil pertandingan", "analisis taktik",
    "berita sepak bola terkini", "goalzone",
  ],
  authors: [{ name: "GOALZONE Team", url: `${SITE_URL}` }],
  creator: "GOALZONE",
  publisher: "GOALZONE",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "GOALZONE",
    title: "GOALZONE - Portal Berita Sepak Bola",
    description: "Live score, klasemen, transfer, dan analisis taktis dari liga-liga top Eropa",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "GOALZONE - Portal Berita Sepak Bola",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GOALZONE - Portal Berita Sepak Bola",
    description: "Live score, klasemen, transfer, dan analisis taktis dari liga-liga top Eropa",
    images: ["/logo.svg"],
    creator: "@goalzone",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        {/* Google AdSense */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-deep-900 text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
