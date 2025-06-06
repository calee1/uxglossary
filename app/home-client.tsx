"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SearchBox } from "@/components/search-box"

interface GlossaryData {
  [letter: string]: any[]
}

export function HomeClient() {
  const [glossaryItems, setGlossaryItems] = useState<GlossaryData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const alphabet = ["0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]
  const totalTerms = Object.values(glossaryItems).reduce((total, items) => total + items.length, 0)
  const hasGlossaryItems = Object.keys(glossaryItems).length > 0

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const response = await fetch("/api/glossary")

        if (!response.ok) {
          throw new Error("Failed to load glossary data")
        }

        const items = await response.json()

        // Group items by letter
        const grouped: GlossaryData = {}
        items.forEach((item: any) => {
          const letter = item.letter.toUpperCase()
          if (!grouped[letter]) {
            grouped[letter] = []
          }
          grouped[letter].push(item)
        })

        setGlossaryItems(grouped)

        // Add this after the existing fetch in the useEffect
        const lastUpdatedResponse = await fetch("/api/glossary/last-updated")
        if (lastUpdatedResponse.ok) {
          const { lastUpdated: date } = await lastUpdatedResponse.json()
          setLastUpdated(date)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load glossary data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-base sm:text-lg text-gray-600 dark:text-gray-300">Loading glossary data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-base sm:text-lg text-red-600 dark:text-red-400 mb-4">Error loading glossary</div>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
          Browse my comprehensive AI-assisted UX glossary
        </p>
      </div>

      <SearchBox />

      {/* Mobile-optimized alphabet grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2 sm:gap-4 justify-center my-6 sm:my-8">
        {alphabet.map((letter) => {
          // For checking if content exists, use "0" for "0-9"
          const dataKey = letter === "0-9" ? "0" : letter
          const hasContent = glossaryItems[dataKey] && glossaryItems[dataKey].length > 0

          return (
            <Link
              key={letter}
              href={hasContent ? `/letter/${letter.toLowerCase()}` : "#"}
              className={`
                text-center p-2 sm:p-4 border-2 rounded-lg transition-all duration-200 min-h-[60px] sm:min-h-[80px] flex flex-col justify-center
                ${
                  hasContent
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-900/40"
                    : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <div className="text-lg sm:text-2xl font-bold">{letter}</div>
              {hasContent && (
                <div className="text-xs mt-1 leading-tight">
                  {glossaryItems[dataKey].length} {glossaryItems[dataKey].length === 1 ? "term" : "terms"}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Mobile-optimized statistics */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Glossary Statistics</h2>
          {lastUpdated && (
            <p className="text-gray-500 dark:text-gray-400 italic text-xs sm:text-sm">Last updated: {lastUpdated}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="p-3 sm:p-2">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(glossaryItems).length}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Letters with content</div>
          </div>
          <div className="p-3 sm:p-2">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{totalTerms}</div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Total terms</div>
          </div>
          <div className="p-3 sm:p-2">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(totalTerms / Math.max(1, Object.keys(glossaryItems).length))}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Average terms per letter</div>
          </div>
        </div>
      </div>
    </>
  )
}
