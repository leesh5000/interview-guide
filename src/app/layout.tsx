import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SEO_CONFIG } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.SITE_URL),
  title: {
    default: SEO_CONFIG.DEFAULT_TITLE,
    template: `%s | ${SEO_CONFIG.SITE_NAME}`,
  },
  description: SEO_CONFIG.DEFAULT_DESCRIPTION,
  keywords: SEO_CONFIG.KEYWORDS,
  authors: [{ name: SEO_CONFIG.SITE_NAME }],
  creator: SEO_CONFIG.SITE_NAME,
  publisher: SEO_CONFIG.SITE_NAME,
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
  alternates: {
    canonical: SEO_CONFIG.SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: SEO_CONFIG.LOCALE,
    url: SEO_CONFIG.SITE_URL,
    siteName: SEO_CONFIG.SITE_NAME,
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    images: [
      {
        url: SEO_CONFIG.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SEO_CONFIG.DEFAULT_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    images: [SEO_CONFIG.DEFAULT_OG_IMAGE],
  },
  verification: {
    // Google Search Console 인증 후 아래 주석 해제하고 코드 입력
    google: "d7968fW5be8uojUB10Nxm2-Gh0yCLJyyy3NGnnJmW40",
    // Naver Search Advisor 인증 코드
    other: {
      "naver-site-verification": "4895840c8227c6ead312f41d0de39de3a4113da3",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
