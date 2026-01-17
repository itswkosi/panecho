import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { SkipToMainContent } from "@/components/shared/SkipToMainContent";
import { Footer } from "@/components/shared/Footer";
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
  title: "PanEcho - Pancreatic Cancer Screening",
  description: "AI-powered CT scan analysis platform for pancreatic cancer screening",
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
        <SkipToMainContent />
        <ErrorBoundary>
          <ToasterProvider />
          <main id="main-content">
            {children}
          </main>
          <Footer />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
