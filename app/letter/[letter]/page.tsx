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
    <main className="max-w-4xl mx-auto p-6 border rounded-lg my-8 bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-blue-500 hover:underline">
            <h1 className="text-4xl font-bold">UX Glossary</h1>
          </Link>
          <span className="text-lg">
            By:{" "}
            <Link href="http://calee.me/" className="text-blue-500 hover:underline">
              calee
            </Link>
          </span>
        </div>
        <Link href="/request-update" className="text-blue-500 hover:underline mt-2 md:mt-0">
          Request an Update
        </Link>
      </div>

      {/* Letter navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={prevLetter ? `/letter/${prevLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            prevLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <ChevronLeft size={20} />
          {prevLetter || "Prev"}
        </Link>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">{letter}</h2>
          <p className="text-gray-600">
            {items.length} term{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Link
          href={nextLetter ? `/letter/${nextLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            nextLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          {nextLetter || "Next"}
          <ChevronRight size={20} />
        </Link>
      </div>

      {/* Alphabet navigation */}
      <div className="flex flex-wrap gap-2 justify-center my-6 p-4 bg-gray-50 rounded-lg">
        {alphabet.map((alphabetLetter) => {
          const hasContent = glossaryItems[alphabetLetter] && glossaryItems[alphabetLetter].length > 0
          const isCurrentLetter = alphabetLetter === letter

          return (
            <Link
              key={alphabetLetter}
              href={hasContent ? `/letter/${alphabetLetter.toLowerCase()}` : "#"}
              className={`
                px-3 py-1 rounded text-sm transition-all duration-200
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
      <div className="flex gap-2 my-8">
        <div className="flex-grow">
          <label htmlFor="search" className="text-lg mr-4">
            Search
          </label>
          <Input
            id="search"
            className="border-2 border-gray-300 rounded-md p-2 w-full"
            placeholder={`Search in ${letter} terms...`}
          />
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8">Go</Button>
      </div>

      {/* Content */}
      <div className="mt-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No terms found for letter "{letter}"</p>
            <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
              ← Back to main glossary
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={`${letter}-${index}`} className="border-l-4 border-blue-200 pl-6 py-2">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.term}</h3>
                <p className="text-gray-700 leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t">
        <Link
          href={prevLetter ? `/letter/${prevLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            prevLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <ChevronLeft size={20} />
          {prevLetter ? `Letter ${prevLetter}` : "Previous"}
        </Link>

        <Link href="/" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
          All Letters
        </Link>

        <Link
          href={nextLetter ? `/letter/${nextLetter.toLowerCase()}` : "#"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            nextLetter ? "text-blue-500 hover:bg-blue-50 border border-blue-200" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          {nextLetter ? `Letter ${nextLetter}` : "Next"}
          <ChevronRight size={20} />
        </Link>
      </div>
    </main>
  )
}
