import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "AG AI Admissions | Student Admission System",
    template: "%s | AG AI Admissions",
  },
  description:
    "Explore academic pathways, submit an application, and get guidance with the AG AI-powered student admissions portal.",
  icons: {
    icon: "/favicon.svg",
  },
  applicationName: "AG AI Admissions",
  generator: "AG AI-Enabled Student Admission System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
