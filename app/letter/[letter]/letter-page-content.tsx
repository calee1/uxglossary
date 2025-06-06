"use client"

import { useState, useCallback } from "react"
import { LetterSearch } from "@/components/letter-search"
import { HighlightedText } from "@/components/highlighted-text"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
}

interface LetterPageContentProps {
  items: GlossaryItem[]
  letter: string
  allItems?: Record<string, GlossaryItem[]>
}

export function LetterPageContent({ items, letter, allItems = {} }: LetterPageContentProps) {
  const [filteredItems, setFilteredItems] = useState<GlossaryItem[]>(items)
  const [searchTerm, setSearchTerm] = useState("")

  const handleFilteredItemsChange = useCallback((newFilteredItems: GlossaryItem[], newSearchTerm: string) => {
    setFilteredItems(newFilteredItems)
    setSearchTerm(newSearchTerm)
  }, [])

  // Function to create term slug
  const createTermSlug = (term: string): string => {
    return term
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-base sm:text-lg xl:text-xl text-gray-600 dark:text-gray-300">
          No terms found for letter "{letter}".
        </p>
      </div>
    )
  }

  const displayLetter = letter === "0" ? "0-9" : letter.toUpperCase()

  return (
    <>
      {/* Search functionality */}
      <LetterSearch items={items} onFilteredItemsChange={handleFilteredItemsChange} />

      {/* Terms list - mobile optimized */}
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {filteredItems.map((item, index) => {
          const termSlug = createTermSlug(item.term)

          return (
            <div
              key={`${item.term}-${index}`}
              id={termSlug}
              className="relative p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 scroll-mt-4"
            >
              {/* Letter tag in upper right corner - mobile optimized */}
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
                  {displayLetter}
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-2 sm:mb-3 pr-8 sm:pr-12">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                  <HighlightedText text={item.term} searchTerm={searchTerm} />
                  {item.acronym && (
                    <span className="ml-2 text-xs sm:text-sm font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                      <HighlightedText text={item.acronym} searchTerm={searchTerm} />
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <HighlightedText text={item.definition} searchTerm={searchTerm} />
              </p>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && searchTerm && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-base sm:text-lg xl:text-xl text-gray-600 dark:text-gray-300">
            No terms found matching "{searchTerm}" in letter "{letter}".
          </p>
        </div>
      )}
    </>
  )
}
