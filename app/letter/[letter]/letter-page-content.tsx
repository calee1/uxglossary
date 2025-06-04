"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { LetterSearch } from "@/components/letter-search"
import { HighlightedText } from "@/components/highlighted-text"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string
}

interface LetterPageContentProps {
  items: GlossaryItem[]
  letter: string
  allItems?: Record<string, GlossaryItem[]>
}

export function LetterPageContent({ items, letter, allItems = {} }: LetterPageContentProps) {
  // Add console log at the beginning of the component
  console.log("LetterPageContent rendering with", items?.length || 0, "items for letter", letter)

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

  // Function to check if a term exists in the glossary
  const findTermInGlossary = (termName: string): { letter: string; slug: string } | null => {
    for (const [letterKey, letterItems] of Object.entries(allItems)) {
      const foundItem = letterItems.find((item) => item.term.toLowerCase() === termName.toLowerCase())
      if (foundItem) {
        return {
          letter: letterKey === "0" ? "0-9" : letterKey.toLowerCase(),
          slug: createTermSlug(foundItem.term),
        }
      }
    }
    return null
  }

  // Function to render see-also links
  const renderSeeAlsoLinks = (seeAlso: string) => {
    const terms = seeAlso
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean)

    return terms.map((term, index) => {
      const termLocation = findTermInGlossary(term)

      if (termLocation) {
        return (
          <span key={term}>
            <Link
              href={`/letter/${termLocation.letter}#${termLocation.slug}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {term}
            </Link>
            {index < terms.length - 1 && ", "}
          </span>
        )
      } else {
        // If term doesn't exist, render as plain text
        return (
          <span key={term} className="text-gray-600 dark:text-gray-400">
            {term}
            {index < terms.length - 1 && ", "}
          </span>
        )
      }
    })
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">No terms found for letter "{letter}".</p>
      </div>
    )
  }

  const displayLetter = letter === "0" ? "0-9" : letter.toUpperCase()

  return (
    <>
      {/* Add debug output at the beginning of the return statement, right after the opening fragment */}
      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded text-sm">
        <strong>Content Debug:</strong> Received {items?.length || 0} items for letter {letter}
        {items?.length > 0 && (
          <>
            <br />
            <strong>First item:</strong> {items[0].term}
            <br />
            <strong>Last item:</strong> {items[items.length - 1].term}
          </>
        )}
      </div>

      {/* Search functionality */}
      <LetterSearch items={items} onFilteredItemsChange={handleFilteredItemsChange} />

      {/* Terms list */}
      <div className="space-y-4 sm:space-y-6">
        {filteredItems.map((item, index) => {
          const termSlug = createTermSlug(item.term)

          return (
            <div
              key={`${item.term}-${index}`}
              id={termSlug}
              className="relative p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 scroll-mt-4"
            >
              {/* Letter tag in upper right corner */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
                  {displayLetter}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 pr-12">
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

              {item.seeAlso && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">See also:</span> {renderSeeAlsoLinks(item.seeAlso)}
                  </p>
                </div>
              )}
            </div>
          )
        })}
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
