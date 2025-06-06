import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WireframeFooter } from "@/components/wireframe-footer"

export const metadata: Metadata = {
  title: {
    default: "UX Glossary - Comprehensive User Experience Terms & Definitions",
    template: "%s | UX Glossary",
  },
  description:
    "A comprehensive glossary of UX (User Experience) terms and definitions. Learn essential UX terminology, design concepts, and industry jargon used by designers and researchers.",
  keywords: [
    "UX glossary",
    "user experience terms",
    "UX definitions",
    "design terminology",
    "UX dictionary",
    "user interface terms",
    "design concepts",
    "UX vocabulary",
    "user experience glossary",
    "design glossary",
  ],
  authors: [{ name: "calee", url: "https://calee.me" }],
  creator: "calee",
  publisher: "calee",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://uxglossary.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://uxglossary.vercel.app",
    title: "UX Glossary - Comprehensive User Experience Terms & Definitions",
    description:
      "A comprehensive glossary of UX (User Experience) terms and definitions. Learn essential UX terminology, design concepts, and industry jargon.",
    siteName: "UX Glossary",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UX Glossary - User Experience Terms & Definitions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UX Glossary - Comprehensive User Experience Terms & Definitions",
    description:
      "A comprehensive glossary of UX (User Experience) terms and definitions. Learn essential UX terminology, design concepts, and industry jargon.",
    images: ["/og-image.png"],
    creator: "@calee607",
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
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://uxglossary.vercel.app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "UX Glossary",
              description: "A comprehensive glossary of UX (User Experience) terms and definitions",
              url: "https://uxglossary.vercel.app",
              author: {
                "@type": "Person",
                name: "calee",
                url: "https://calee.me",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://uxglossary.vercel.app/?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
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
