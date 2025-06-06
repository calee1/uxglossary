import Link from "next/link"
import { notFound } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LetterNavigation } from "@/components/letter-navigation"
import { LetterPageClient } from "./letter-page-client"
import { getGlossaryItemsByLetter } from "@/lib/glossary-data"
import type { Metadata } from "next"

interface LetterPageProps {
  params: {
    letter: string
  }
}

export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const letter = params.letter === "0-9" ? "0" : params.letter.toUpperCase()
  const displayLetter = params.letter === "0-9" ? "Numbers" : letter

  try {
    const letterItems = await getGlossaryItemsByLetter(letter)
    const termCount = letterItems.length
    const sampleTerms = letterItems
      .slice(0, 5)
      .map((item) => item.term)
      .join(", ")

    return {
      title: `${displayLetter} - UX Terms & Definitions`,
      description: `Explore ${termCount} UX terms starting with ${displayLetter}. Including: ${sampleTerms}${termCount > 5 ? " and more" : ""}. Learn essential user experience terminology.`,
      openGraph: {
        title: `${displayLetter} - UX Terms & Definitions | UX Glossary`,
        description: `Explore ${termCount} UX terms starting with ${displayLetter}. Including: ${sampleTerms}${termCount > 5 ? " and more" : ""}.`,
        url: `https://uxglossary.vercel.app/letter/${params.letter}`,
      },
      twitter: {
        title: `${displayLetter} - UX Terms & Definitions | UX Glossary`,
        description: `Explore ${termCount} UX terms starting with ${displayLetter}. Including: ${sampleTerms}${termCount > 5 ? " and more" : ""}.`,
      },
      alternates: {
        canonical: `https://uxglossary.vercel.app/letter/${params.letter}`,
      },
    }
  } catch (error) {
    return {
      title: `${displayLetter} - UX Terms & Definitions`,
      description: `Explore UX terms starting with ${displayLetter}. Learn essential user experience terminology and definitions.`,
    }
  }
}

export async function generateStaticParams() {
  const alphabet = ["0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i).toLowerCase())]
  return alphabet.map((letter) => ({
    letter: letter,
  }))
}

export default async function LetterPage({ params }: LetterPageProps) {
  const letter = params.letter === "0-9" ? "0" : params.letter.toUpperCase()
  const alphabet = ["0", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  if (!alphabet.includes(letter)) {
    notFound()
  }

  let glossaryItems = []
  try {
    glossaryItems = await getGlossaryItemsByLetter(letter)
  } catch (error) {
    console.error("Error loading glossary items:", error)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `UX Terms Starting with ${params.letter === "0-9" ? "Numbers" : letter}`,
            description: `Collection of UX terms and definitions starting with ${params.letter === "0-9" ? "numbers" : letter}`,
            url: `https://uxglossary.vercel.app/letter/${params.letter}`,
            isPartOf: {
              "@type": "WebSite",
              name: "UX Glossary",
              url: "https://uxglossary.vercel.app",
            },
            mainEntity: glossaryItems.slice(0, 10).map((item) => ({
              "@type": "DefinedTerm",
              name: item.term,
              description: item.definition,
              inDefinedTermSet: "https://uxglossary.vercel.app",
            })),
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
            <Link href="/" className="text-blue-500 dark:text-blue-400 hover:underline">
              Home
            </Link>
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

        <LetterNavigation currentLetter={params.letter} />

        <LetterPageClient letter={params.letter} />

        <LetterNavigation currentLetter={params.letter} />

        <div className="mt-8 sm:mt-12 text-center">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            Back to All Letters
          </Link>
        </div>
      </main>
    </>
  )
}
