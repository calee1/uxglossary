"use client"

import { useState, useCallback } from "react"
import { LetterSearch } from "@/components/letter-search"
import { HighlightedText } from "@/components/highlighted-text"
import type { GlossaryItem } from "@/lib/csv-parser"
import Link from "next/link"

interface LetterPageContentProps {
  items: GlossaryItem[]
  letter: string
}

export function LetterPageContent({ items, letter }: LetterPageContentProps) {
  const [filteredItems, setFilteredItems] = useState<GlossaryItem[]>(items)
  const [searchTerm, setSearchTerm] = useState("")

  const handleFilteredItemsChange = useCallback((filtered: GlossaryItem[], term: string) => {
    setFilteredItems(filtered)
    setSearchTerm(term)
  }, [])

  return (
    <>
      {/* Search box - now functional */}
      <LetterSearch items={items} onFilteredItemsChange={handleFilteredItemsChange} />

      {/* Content */}
      <div className="mt-6 sm:mt-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            {searchTerm ? (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2">
                  No terms found matching "{searchTerm}" on this page
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Try a different search term or clear the search to see all {items.length} terms
                </p>
              </div>
            ) : items.length === 0 ? (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
                  No terms found for letter "{letter}"
                </p>
                <Link href="/" className="text-blue-500 dark:text-blue-400 hover:underline mt-3 sm:mt-4 inline-block">
                  ← Back to main glossary
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredItems.map((item, index) => (
              <div
                key={`${letter}-${index}`}
                className="border-l-4 border-blue-200 dark:border-blue-600 pl-4 sm:pl-6 py-2"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">
                  <HighlightedText text={item.term} searchTerm={searchTerm} />
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  <HighlightedText text={item.definition} searchTerm={searchTerm} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
