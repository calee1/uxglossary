"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string
}

interface LetterSearchProps {
  items: GlossaryItem[]
  onFilteredItemsChange?: (filteredItems: GlossaryItem[], searchTerm: string) => void
}

export function LetterSearch({ items = [], onFilteredItemsChange }: LetterSearchProps) {
  // Add console log at the beginning of the component
  console.log("LetterSearch component rendering with", items?.length || 0, "items")

  const [searchTerm, setSearchTerm] = useState("")

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return []
    }

    if (!searchTerm.trim()) {
      return items
    }

    return items.filter(
      (item) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.acronym && item.acronym.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.seeAlso && item.seeAlso.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [items, searchTerm])

  // Update parent component when filtered items change
  useEffect(() => {
    if (onFilteredItemsChange) {
      onFilteredItemsChange(filteredItems, searchTerm)
    }
  }, [filteredItems, searchTerm, onFilteredItemsChange])

  const clearSearch = () => {
    setSearchTerm("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      clearSearch()
    }
  }

  const itemCount = items?.length || 0

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-6 sm:mb-8">
      {/* Add debug output at the beginning of the return statement */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
        <strong>Search Debug:</strong> Received {items?.length || 0} items
        {items?.length > 0 && (
          <>
            <br />
            <strong>First item:</strong> {items[0].term}
            <br />
            <strong>Last item:</strong> {items[items.length - 1].term}
          </>
        )}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <Input
          type="text"
          placeholder={`Search ${itemCount} terms on this page...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 text-base sm:text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3">
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Search results summary */}
      {searchTerm && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {filteredItems.length === 0 ? (
            <span className="text-red-600 dark:text-red-400">No terms found for "{searchTerm}" on this page</span>
          ) : filteredItems.length === itemCount ? (
            <span>Showing all {itemCount} terms</span>
          ) : (
            <span>
              Showing {filteredItems.length} of {itemCount} terms matching "{searchTerm}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}
