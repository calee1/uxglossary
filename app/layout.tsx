import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Copyright } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
            <div className="flex-grow">{children}</div>
            <footer className="py-4 px-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 text-sm text-gray-900 dark:text-gray-100">
              <Copyright className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>
                copyright{" "}
                <a href="https://calee.me" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  calee
                </a>{" "}
                2025
              </span>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
