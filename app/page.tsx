import Link from "next/link"
import { loadGlossaryData } from "@/lib/csv-parser"
import { SearchBox } from "@/components/search-box"

export default async function HomePage() {
  // Load glossary data to see which letters have content
  const glossaryItems = await loadGlossaryData()
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  // Check if we have any glossary items
  const hasGlossaryItems = Object.keys(glossaryItems).length > 0

  return (
    <main className="max-w-4xl mx-auto p-6 border rounded-lg my-8 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <div>
            <h1 className="text-4xl font-bold">UX Glossary</h1>
            <p className="text-sm text-gray-500 italic mt-1">work in progress - June 2025</p>
          </div>
          <span className="text-lg">
            By:{" "}
            <Link href="http://calee.me/" className="text-blue-500 hover:underline">
              calee
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 md:mt-0">
          <Link href="/request-update" className="text-blue-500 hover:underline">
            Request an Update
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/admin" className="text-blue-500 hover:underline">
            Admin
          </Link>
        </div>
      </div>

      <div className="text-center mb-8">
        <p className="text-lg text-gray-600 mb-6">
          Browse my comprehensive AI-assisted glossary by selecting a letter below
        </p>
      </div>

      {/* Search Box */}
      <SearchBox glossaryItems={glossaryItems} />

      {!hasGlossaryItems && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-8">
          <h3 className="text-yellow-800 font-medium text-lg mb-2">Getting Started</h3>
          <p className="text-yellow-700">
            The glossary is being initialized with default data. If you're seeing this message, the application is
            creating the necessary files. Please refresh the page in a few seconds.
          </p>
        </div>
      )}

      {/* Alphabet navigation grid */}
      <div className="grid grid-cols-6 md:grid-cols-13 gap-4 justify-center my-8">
        {alphabet.map((letter) => {
          const hasContent = glossaryItems[letter] && glossaryItems[letter].length > 0
          return (
            <Link
              key={letter}
              href={hasContent ? `/letter/${letter.toLowerCase()}` : "#"}
              className={`
                text-center p-4 border-2 rounded-lg transition-all duration-200
                ${
                  hasContent
                    ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-600"
                    : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              <div className="text-2xl font-bold">{letter}</div>
              {hasContent && (
                <div className="text-xs mt-1">
                  {glossaryItems[letter].length} term{glossaryItems[letter].length !== 1 ? "s" : ""}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Statistics */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Glossary Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{Object.keys(glossaryItems).length}</div>
            <div className="text-gray-600">Letters with content</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(glossaryItems).reduce((total, items) => total + items.length, 0)}
            </div>
            <div className="text-gray-600">Total terms</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(
                Object.values(glossaryItems).reduce((total, items) => total + items.length, 0) /
                  Math.max(1, Object.keys(glossaryItems).length),
              )}
            </div>
            <div className="text-gray-600">Average terms per letter</div>
          </div>
        </div>
      </div>
    </main>
  )
}
