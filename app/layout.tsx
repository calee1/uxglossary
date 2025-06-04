import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WireframeFooter } from "@/components/wireframe-footer"

export const metadata: Metadata = {
  title: "UX Glossary",
  description: "A comprehensive glossary of UX terms and definitions",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors">
            <div className="flex-grow">{children}</div>
            <WireframeFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
