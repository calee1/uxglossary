import Link from "next/link"
import { SearchBox } from "@/components/search-box"
import { ThemeToggle } from "@/components/theme-toggle"

async function loadGlossaryDataSafe() {
  try {
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    return await loadGlossaryData()
  } catch (error) {
    console.error("Failed to load glossary data:", error)
    return {}
  }
}

export default async function HomePage() {
  const glossaryItems = await loadGlossaryDataSafe()
  const hasGlossaryItems = Object.keys(glossaryItems).length > 0
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

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
          <span className="text-gray-500 dark:text-gray-400">Home</span>
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

      <div className="text-center mb-8">
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">Browse my comprehensive AI-assisted UX glossary</p>
      </div>

      <SearchBox />

      {!hasGlossaryItems && (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-8">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-medium text-lg mb-2">Loading...</h3>
          <p className="text-yellow-700 dark:text-yellow-300">The glossary is loading. Please wait a moment.</p>
        </div>
      )}

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
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <div className="text-2xl font-bold">{letter}</div>
              {hasContent && (
                <div className="text-xs mt-1">
                  {glossaryItems[letter].length} {glossaryItems[letter].length === 1 ? "term" : "terms"}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Glossary Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(glossaryItems).length}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Letters with content</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Object.values(glossaryItems).reduce((total, items) => total + items.length, 0)}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Total terms</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(
                Object.values(glossaryItems).reduce((total, items) => total + items.length, 0) /
                  Math.max(1, Object.keys(glossaryItems).length),
              )}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Average terms per letter</div>
          </div>
        </div>
      </div>
    </main>
  )
}
