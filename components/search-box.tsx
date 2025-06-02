"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import type { GlossaryItem } from "@/lib/csv-parser"

interface SearchBoxProps {
  glossaryItems: Record<string, GlossaryItem[]>
}

export function SearchBox({ glossaryItems }: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<GlossaryItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Memoize the flattened glossary items to prevent recalculation on every render
  const allItems = useMemo(() => Object.values(glossaryItems).flat(), [glossaryItems])

  // Update suggestions when search term changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = allItems
        .filter(
          (item) =>
            item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 8) // Limit to 8 suggestions
      setSuggestions(filtered)
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm, allItems])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          navigateToTerm(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const navigateToTerm = (item: GlossaryItem) => {
    const letter = item.letter.toLowerCase()
    window.location.href = `/letter/${letter}#${item.term.toLowerCase().replace(/\s+/g, "-")}`
  }

  const clearSearch = () => {
    setSearchTerm("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Memoize the filtered results count to prevent recalculation on every render
  const totalMatchCount = useMemo(() => {
    if (!searchTerm) return 0
    return allItems.filter(
      (item) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
    ).length
  }, [searchTerm, allItems])

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-6 sm:mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search UX terms and definitions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setShowSuggestions(true)}
          className="pl-8 sm:pl-10 pr-16 sm:pr-20 py-2 sm:py-3 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 sm:gap-2 pr-2 sm:pr-3">
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            </button>
          )}
          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1 px-2 sm:px-3"
            onClick={() => {
              if (suggestions.length > 0) {
                navigateToTerm(suggestions[0])
              }
            }}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 sm:max-h-96 overflow-y-auto">
          {suggestions.map((item, index) => (
            <button
              key={`${item.letter}-${item.term}`}
              onClick={() => navigateToTerm(item)}
              className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                    {highlightMatch(item.term, searchTerm)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {highlightMatch(
                      item.definition.length > 100 ? item.definition.substring(0, 100) + "..." : item.definition,
                      searchTerm,
                    )}
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                    {item.letter}
                  </span>
                </div>
              </div>
            </button>
          ))}
          {totalMatchCount > 8 && (
            <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 bg-gray-50 text-center">
              Showing first 8 of {totalMatchCount} results. Try a more specific search for better results.
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-3 sm:px-4 py-4 sm:py-6 text-center text-gray-500">
            <Search className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs sm:text-sm">No terms found for "{searchTerm}"</p>
            <p className="text-xs mt-1">Try a different search term or browse by letter below</p>
          </div>
        </div>
      )}
    </div>
  )
}
