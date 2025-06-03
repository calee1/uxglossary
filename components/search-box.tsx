"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HighlightedText } from "./highlighted-text"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string
}

export function SearchBox() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlossaryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const searchTerms = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/glossary/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data || [])
          setShowResults(true)
        } else {
          setResults([])
          setShowResults(false)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
        setShowResults(false)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchTerms, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleClear = () => {
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  const createTermSlug = (term: string): string => {
    return term
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-6 sm:mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search terms and definitions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 py-3 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            Clear
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.slice(0, 10).map((item, index) => (
                <Link
                  key={index}
                  href={`/letter/${item.letter === "0" ? "0-9" : item.letter.toLowerCase()}#${createTermSlug(item.term)}`}
                  className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setShowResults(false)}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    <HighlightedText text={item.term} searchTerm={query} />
                    {item.acronym && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({item.acronym})</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    <HighlightedText text={item.definition} searchTerm={query} />
                  </div>
                </Link>
              ))}
              {results.length > 10 && (
                <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-200 dark:border-gray-600">
                  Showing first 10 of {results.length} results
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No results found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  )
}
