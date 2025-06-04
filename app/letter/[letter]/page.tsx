import Link from "next/link"
import { notFound } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LetterPageContent } from "./letter-page-content"

interface LetterPageProps {
  params: {
    letter: string
  }
}

async function loadGlossaryDataSafe() {
  try {
    console.log("Letter page: Starting to load glossary data...")
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    console.log("Letter page: Import successful, calling function...")
    const data = await loadGlossaryData()
    console.log("Letter page: Function completed")
    console.log("Letter page: Data keys:", Object.keys(data))
    console.log("Letter page: A count:", data["A"]?.length || 0)
    console.log("Letter page: B count:", data["B"]?.length || 0)
    console.log(
      "Letter page: Total terms:",
      Object.values(data).reduce((sum, items) => sum + items.length, 0),
    )
    return data
  } catch (error) {
    console.error("Letter page: Failed to load glossary data:", error)
    console.error("Letter page: Error stack:", error instanceof Error ? error.stack : "No stack")
    return {}
  }
}

export default async function LetterPage({ params }: LetterPageProps) {
  console.log("Letter page rendering with params:", params)

  const letter = params.letter === "0-9" ? "0" : params.letter.toUpperCase()
  const displayLetter = params.letter === "0-9" ? "0-9" : params.letter.toUpperCase()

  console.log("Letter page: URL param =", params.letter, "| Lookup key =", letter, "| Display =", displayLetter)

  const alphabet = ["0", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  if (!alphabet.includes(letter)) {
    console.log("Letter not in alphabet, showing 404")
    notFound()
  }

  console.log("Letter page: About to load glossary data...")
  const glossaryItems = await loadGlossaryDataSafe()
  console.log("Letter page: Glossary data loaded, keys:", Object.keys(glossaryItems))

  const items = glossaryItems[letter] || []
  console.log(`Letter page for "${letter}": Found ${items.length} items`)

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
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{displayLetter}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {items.length} {items.length === 1 ? "term" : "terms"}
        </p>
      </div>

      {/* Enhanced debug info */}
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
        <strong>Debug Info:</strong>
        <br />
        <strong>URL Parameter:</strong> {params.letter}
        <br />
        <strong>Lookup Key:</strong> {letter}
        <br />
        <strong>Available Letters:</strong> {Object.keys(glossaryItems).join(", ")}
        <br />
        <strong>Items Found:</strong> {items.length}
        <br />
        <strong>Total Items in Data:</strong>{" "}
        {Object.values(glossaryItems).reduce((sum, items) => sum + items.length, 0)}
        <br />
        {Object.keys(glossaryItems).length > 0 && (
          <>
            <strong>Sample from A:</strong> {glossaryItems["A"]?.[0]?.term || "No A data"}
            <br />
            <strong>Sample from B:</strong> {glossaryItems["B"]?.[0]?.term || "No B data"}
          </>
        )}
        <br />
        <Link href="/api/simple-test" className="text-blue-600 hover:underline">
          Test API (working)
        </Link>
        {" | "}
        <Link href="/api/direct-letter/a" className="text-blue-600 hover:underline">
          Direct API (working)
        </Link>
      </div>

      {items.length === 0 && Object.keys(glossaryItems).length === 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
          <strong>No Data Loaded:</strong>
          <br />
          The glossary data is completely empty. This suggests an issue with the CSV parser when called from the page
          component.
          <br />
          <Link href="/api/simple-test" className="text-blue-600 hover:underline">
            Check API test (this works)
          </Link>
        </div>
      )}

      <LetterPageContent items={items} letter={letter} allItems={glossaryItems} />

      <div className="mt-12 text-center">
        <Link href="/" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          Back to All Letters
        </Link>
      </div>
    </main>
  )
}
