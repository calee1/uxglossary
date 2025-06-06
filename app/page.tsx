import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomeClient } from "./home-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "UX Glossary - Comprehensive User Experience Terms & Definitions",
  description:
    "Explore our comprehensive UX glossary with hundreds of user experience terms, definitions, and concepts. Perfect for designers, researchers, and anyone learning UX.",
  openGraph: {
    title: "UX Glossary - Comprehensive User Experience Terms & Definitions",
    description:
      "Explore our comprehensive UX glossary with hundreds of user experience terms, definitions, and concepts. Perfect for designers, researchers, and anyone learning UX.",
    url: "https://uxglossary.vercel.app",
  },
  twitter: {
    title: "UX Glossary - Comprehensive User Experience Terms & Definitions",
    description:
      "Explore our comprehensive UX glossary with hundreds of user experience terms, definitions, and concepts. Perfect for designers, researchers, and anyone learning UX.",
  },
  alternates: {
    canonical: "https://uxglossary.vercel.app",
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "UX Glossary",
            description: "A comprehensive collection of User Experience (UX) terms and definitions",
            url: "https://uxglossary.vercel.app",
            inDefinedTermSet: "https://uxglossary.vercel.app",
            hasDefinedTerm: {
              "@type": "DefinedTerm",
              name: "User Experience",
              description: "The overall experience of a person using a product, system or service",
            },
          }),
        }}
      />
      <main className="max-w-4xl mx-auto p-3 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg my-2 sm:my-8 bg-white dark:bg-gray-800">
        {/* Mobile-optimized header */}
        <div className="flex flex-col space-y-4 mb-6">
          {/* Title section */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">UX Glossary</h1>
            <span className="text-base sm:text-lg text-gray-900 dark:text-gray-100">
              By:{" "}
              <Link href="http://calee.me/" className="text-blue-500 dark:text-blue-400 hover:underline">
                calee
              </Link>
            </span>
          </div>

          {/* Mobile-optimized navigation */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Home</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link href="/request-update" className="text-blue-500 dark:text-blue-400 hover:underline">
              Request Update
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link href="/admin" className="text-blue-500 dark:text-blue-400 hover:underline">
              Admin
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <ThemeToggle />
          </div>
        </div>

        <HomeClient />
      </main>
    </>
  )
}
