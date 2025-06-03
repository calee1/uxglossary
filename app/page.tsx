import Link from "next/link"
import { SearchBox } from "@/components/search-box"
import { ThemeToggle } from "@/components/theme-toggle"

async function loadGlossaryDataSafe() {
  try {
    console.log("Page: Loading glossary data...")
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    const data = await loadGlossaryData()
    console.log("Page: Loaded data with keys:", Object.keys(data))
    return data
  } catch (error) {
    console.error("Page: Failed to load glossary data:", error)
    return {}
  }
}

export default async function HomePage() {
  const glossaryItems = await loadGlossaryDataSafe()
  const hasGlossaryItems = Object.keys(glossaryItems).length > 0
  const allLettersHaveContent = Object.keys(glossaryItems).length === 26
  const alphabetWithNumbers = ["0", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  console.log("Page: Has glossary items:", hasGlossaryItems)
  console.log("Page: Letters with content:", Object.keys(glossaryItems))

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg my-4 sm:my-8 bg-white dark:bg-gray-800 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">UX Glossary</h1>
          </div>
          <span className="text-base sm:text-lg mt-1 md:mt-0 text-gray-900 dark:text-gray-100">
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

      <div className="text-center mb-6 sm:mb-8">
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
          Browse my comprehensive AI-assisted UX glossary
        </p>
      </div>

      <SearchBox />

      {!hasGlossaryItems && (
        <div className="p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6 sm:mb-8">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-medium text-lg mb-2">Loading Glossary Data</h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            The glossary data is being loaded. If this message persists, there may be an issue with the data file.
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
            Debug info: Found {Object.keys(glossaryItems).length} letter groups
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-13 gap-2 sm:gap-4 justify-center my-6 sm:my-8">
        {alphabetWithNumbers.map((letter) => {
          const hasContent =
            glossaryItems[letter] && Array.isArray(glossaryItems[letter]) && glossaryItems[letter].length > 0
          const displayLabel = letter === "0" ? "0-9" : letter

          return (
            <Link
              key={letter}
              href={hasContent ? `/letter/${letter === "0" ? "0-9" : letter.toLowerCase()}` : "#"}
              className={`
                text-center p-2 sm:p-4 border-2 rounded-lg transition-all duration-200
                ${
                  hasContent
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-600 dark:hover:border-blue-300"
                    : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <div className="text-xl sm:text-2xl font-bold">{displayLabel}</div>
              {hasContent && (
                <div className="text-xs mt-1 whitespace-nowrap">
                  {glossaryItems[letter].length} {glossaryItems[letter].length === 1 ? "term" : "terms"}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Glossary Statistics</h2>
          <span className="text-xs sm:text-sm italic text-gray-500 dark:text-gray-400">
            (Last updated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            )
          </span>
        </div>
        <div
          className={`grid grid-cols-1 gap-4 text-center ${allLettersHaveContent ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
        >
          {!allLettersHaveContent && (
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Object.keys(glossaryItems).length}
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Letters with content</div>
            </div>
          )}
          <div className="p-2">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {Object.values(glossaryItems).reduce(
                (total, items) => total + (Array.isArray(items) ? items.length : 0),
                0,
              )}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Total terms</div>
          </div>
          <div className="p-2">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(
                Object.values(glossaryItems).reduce(
                  (total, items) => total + (Array.isArray(items) ? items.length : 0),
                  0,
                ) / Math.max(1, Object.keys(glossaryItems).length),
              )}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Average terms per letter</div>
          </div>
        </div>
      </div>
    </main>
  )
}
