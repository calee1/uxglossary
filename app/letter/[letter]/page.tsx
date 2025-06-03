import Link from "next/link"
import { notFound } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface LetterPageProps {
  params: {
    letter: string
  }
}

async function loadGlossaryDataSafe() {
  try {
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    return await loadGlossaryData()
  } catch (error) {
    console.error("Failed to load glossary data:", error)
    return {}
  }
}

export default async function LetterPage({ params }: LetterPageProps) {
  const letter = params.letter === "0-9" ? "0" : params.letter.toUpperCase()
  const displayLetter = params.letter === "0-9" ? "0-9" : params.letter.toUpperCase()

  const alphabet = ["0", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  if (!alphabet.includes(letter)) {
    notFound()
  }

  const glossaryItems = await loadGlossaryDataSafe()
  const items = glossaryItems[letter] || []

  console.log(`Letter page for "${letter}" has ${items.length} items`)

  return (
    <main className="max-w-4xl mx-auto p-6 border border-gray-200 dark:border-gray-700 rounded-lg my-8 bg-white dark:bg-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-baseline gap-3">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">UX Glossary</h1>
          <span className="text-lg text-gray-900 dark:text-gray-100">
            By:{" "}
            <Link href="http://calee.me/" className="text-blue-500 dark:text-blue-400 hover:underline">
              calee
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <Link href="/" className="text-blue-500 dark:text-blue-400 hover:underline">
            Home
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/debug" className="text-blue-500 dark:text-blue-400 hover:underline">
            Debug
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{displayLetter}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {items.length} {items.length === 1 ? "term" : "terms"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-300">No terms found for letter "{displayLetter}".</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Debug: Looking for letter "{letter}" in data</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, index) => (
            <div
              key={`${item.term}-${index}`}
              className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {item.term}
                  {item.acronym && (
                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      {item.acronym}
                    </span>
                  )}
                </h3>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {displayLetter}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.definition}</p>
              {item.seeAlso && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">See also:</span> {item.seeAlso}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          Back to All Letters
        </Link>
      </div>
    </main>
  )
}
