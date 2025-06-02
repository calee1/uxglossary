import Link from "next/link"
import { notFound } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loadGlossaryData } from "@/lib/csv-parser"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface LetterPageProps {
  params: {
    letter: string
  }
}

export default async function LetterPage({ params }: LetterPageProps) {
  const letter = params.letter.toUpperCase()
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  // Validate letter
  if (!alphabet.includes(letter)) {
    notFound()
  }

  // Load glossary data
  const glossaryItems = await loadGlossaryData()
  const items = glossaryItems[letter] || []

  // Get previous and next letters with content
  const lettersWithContent = Object.keys(glossaryItems).sort()
  const currentIndex = lettersWithContent.indexOf(letter)
  const prevLetter = currentIndex > 0 ? lettersWithContent[currentIndex - 1] : null
  const nextLetter = currentIndex < lettersWithContent.length - 1 ? lettersWithContent[currentIndex + 1] : null

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 border rounded-lg my-4 sm:my-8 bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
          <Link href="/" className="text-blue-500 hover:underline">
            <h1 className="text-3xl sm:text-4xl font-bold">UX Glossary</h1>
          </Link>
          <span className="text-base sm:text-lg mt-1 md:mt-0">
            By:{" "}
            <Link href="http://calee.me/" className="text-blue-500 hover:underline">
              calee
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <Link href="/request-update" className="text-blue-500 hover:underline">
            Request an Update
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/admin" className="text-blue-500 hover:underline">
            Admin
          </Link>
        </div>
      </div>

      {/* Letter navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={prevLetter ? `/letter/${prevLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg ${
            prevLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{prevLetter || "Prev"}</span>
        </Link>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{letter}</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {items.length} {items.length === 1 ? "term" : "terms"}
          </p>
        </div>

        <Link
          href={nextLetter ? `/letter/${nextLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg ${
            nextLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <span className="text-sm sm:text-base">{nextLetter || "Next"}</span>
          <ChevronRight size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>

      {/* Alphabet navigation - more responsive */}
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center my-4 sm:my-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
        {alphabet.map((alphabetLetter) => {
          const hasContent = glossaryItems[alphabetLetter] && glossaryItems[alphabetLetter].length > 0
          const isCurrentLetter = alphabetLetter === letter

          return (
            <Link
              key={alphabetLetter}
              href={hasContent ? `/letter/${alphabetLetter.toLowerCase()}` : "#"}
              className={`
                px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-all duration-200
                ${
                  isCurrentLetter
                    ? "bg-blue-500 text-white font-bold"
                    : hasContent
                      ? "text-blue-500 hover:bg-blue-100"
                      : "text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {alphabetLetter}
            </Link>
          )
        })}
      </div>

      {/* Search box */}
      <div className="flex flex-col sm:flex-row gap-2 my-6 sm:my-8">
        <div className="flex-grow">
          <label htmlFor="search" className="text-base sm:text-lg block sm:inline-block mb-1 sm:mb-0 sm:mr-4">
            Search
          </label>
          <Input
            id="search"
            className="border-2 border-gray-300 rounded-md p-2 w-full"
            placeholder={`Search in ${letter} terms...`}
          />
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-8 mt-2 sm:mt-0 sm:self-end">Go</Button>
      </div>

      {/* Content */}
      <div className="mt-6 sm:mt-8">
        {items.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">No terms found for letter "{letter}"</p>
            <Link href="/" className="text-blue-500 hover:underline mt-3 sm:mt-4 inline-block">
              ← Back to main glossary
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {items.map((item, index) => (
              <div key={`${letter}-${index}`} className="border-l-4 border-blue-200 pl-4 sm:pl-6 py-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">{item.term}</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex justify-between items-center mt-8 sm:mt-12 pt-4 sm:pt-6 border-t">
        <Link
          href={prevLetter ? `/letter/${prevLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg ${
            prevLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">{prevLetter ? `Letter ${prevLetter}` : "Previous"}</span>
        </Link>

        <Link href="/" className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
          All Letters
        </Link>

        <Link
          href={nextLetter ? `/letter/${nextLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg ${
            nextLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <span className="text-xs sm:text-sm">{nextLetter ? `Letter ${nextLetter}` : "Next"}</span>
          <ChevronRight size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>
    </main>
  )
}
