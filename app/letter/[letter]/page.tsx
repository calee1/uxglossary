import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LetterPageContent } from "./letter-page-content"

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
  const alphabetWithNumbers = ["0", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  if (!alphabetWithNumbers.includes(letter)) {
    notFound()
  }

  const glossaryItems = await loadGlossaryDataSafe()
  const items = glossaryItems[letter] || []

  const lettersWithContent = Object.keys(glossaryItems).sort()
  const currentIndex = lettersWithContent.indexOf(letter)
  const prevLetter = currentIndex > 0 ? lettersWithContent[currentIndex - 1] : null
  const nextLetter = currentIndex < lettersWithContent.length - 1 ? lettersWithContent[currentIndex + 1] : null

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg my-4 sm:my-8 bg-white dark:bg-gray-800 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">UX Glossary</h1>
          <span className="text-base sm:text-lg mt-1 md:mt-0 text-gray-900 dark:text-gray-100">
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
          <Link href="/request-update" className="text-blue-500 dark:text-blue-400 hover:underline">
            Request an Update
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/admin" className="text-blue-500 dark:text-blue-400 hover:underline">
            Admin
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Link
          href={prevLetter ? `/letter/${prevLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${
            prevLetter
              ? "text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{prevLetter || "Prev"}</span>
        </Link>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{displayLetter}</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {items.length} {items.length === 1 ? "term" : "terms"}
          </p>
        </div>

        <Link
          href={nextLetter ? `/letter/${nextLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${
            nextLetter
              ? "text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <span className="text-sm sm:text-base">{nextLetter || "Next"}</span>
          <ChevronRight size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-13 gap-1 sm:gap-2 justify-items-center my-4 sm:my-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {alphabetWithNumbers.map((alphabetLetter) => {
          const hasContent = glossaryItems[alphabetLetter] && glossaryItems[alphabetLetter].length > 0
          const isCurrentLetter = alphabetLetter === letter
          const displayLabel = alphabetLetter === "0" ? "0-9" : alphabetLetter
          const linkPath = alphabetLetter === "0" ? "0-9" : alphabetLetter.toLowerCase()

          return (
            <Link
              key={alphabetLetter}
              href={hasContent ? `/letter/${linkPath}` : "#"}
              className={`
                px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-all duration-200 whitespace-nowrap
                ${
                  isCurrentLetter
                    ? "bg-blue-500 dark:bg-blue-600 text-white font-bold"
                    : hasContent
                      ? "text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {displayLabel}
            </Link>
          )
        })}
      </div>

      <LetterPageContent items={items} letter={letter} allItems={glossaryItems} />

      <div className="flex justify-between items-center mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          href={prevLetter ? `/letter/${prevLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${
            prevLetter
              ? "text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">{prevLetter ? `Letter ${prevLetter}` : "Previous"}</span>
        </Link>

        <Link
          href="/"
          className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100 transition-colors"
        >
          All Letters
        </Link>

        <Link
          href={nextLetter ? `/letter/${nextLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${
            nextLetter
              ? "text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <span className="text-xs sm:text-sm">{nextLetter ? `Letter ${nextLetter}` : "Next"}</span>
          <ChevronRight size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>
    </main>
  )
}
