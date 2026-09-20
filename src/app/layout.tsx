import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BOOK_INTRO_SKIP_SCRIPT } from "@/lib/bookIntro";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jaewon.homes"),
  title: {
    default: "JAEWON'S PORTFOLIO",
    template: "%s | 김재원 포트폴리오",
  },
  description: "개인 소개 포트폴리오",
  openGraph: {
    title: "JAEWON'S PORTFOLIO",
    description: "개인 소개 포트폴리오",
    url: "https://jaewon.homes",
    siteName: "JAEWON'S PORTFOLIO",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: 인트로 스크립트가 hydration 전에 <html>에 data-intro-skip을 붙일 수 있음
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOK_INTRO_SKIP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
