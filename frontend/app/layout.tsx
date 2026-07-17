import type { Metadata } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/dashboard/ThemeToggle";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RetentionIQ — Product Analytics Dashboard",
  description:
    "Funnel drop-off, cohort retention, and feature adoption analysis built with FastAPI, Postgres, and Next.js.",
  openGraph: {
    title: "RetentionIQ — Product Analytics Dashboard",
    description:
      "Portfolio project: SQL-first analytics on 8.4M events with funnel, cohort, and feature adoption views.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
