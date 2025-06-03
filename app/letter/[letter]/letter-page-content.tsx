"use client"

import { useState, useCallback } from "react"
import type { GlossaryItem } from "@/lib/csv-parser"
import { LetterSearch } from "@/components/letter-search"
import { HighlightedText } from "@/components/highlighted-text"

interface LetterPageContentProps {
  items: GlossaryItem[]
  letter: string
}

export function LetterPageContent({ items, letter }: LetterPageContentProps) {
  const [filteredItems, setFilteredItems] = useState<GlossaryItem[]>(items)
  const [searchTerm, setSearchTerm] = useState("")

  const handleFilteredItemsChange = useCallback((newFilteredItems: GlossaryItem[], newSearchTerm: string) => {
    setFilteredItems(newFilteredItems)
    setSearchTerm(newSearchTerm)
  }, [])

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">No terms found for letter "{letter}".</p>
      </div>
    )
  }

  return (
    <>
      {/* Search functionality */}
      <LetterSearch items={items} onFilteredItemsChange={handleFilteredItemsChange} />

      {/* Terms list */}
      <div className="space-y-4 sm:space-y-6">
        {filteredItems.map((item, index) => (
          <div
            key={`${item.term}-${index}`}
            className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                <HighlightedText text={item.term} searchTerm={searchTerm} />
                {item.acronym && (
                  <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    <HighlightedText text={item.acronym} searchTerm={searchTerm} />
                  </span>
                )}
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <HighlightedText text={item.definition} searchTerm={searchTerm} />
            </p>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && searchTerm && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            No terms found matching "{searchTerm}" in letter "{letter}".
          </p>
        </div>
      )}
    </>
  )
}
