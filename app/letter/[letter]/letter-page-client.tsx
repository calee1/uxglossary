"use client"

import { useState, useEffect } from "react"
import { LetterPageContent } from "./letter-page-content"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string
}

interface LetterPageClientProps {
  letter: string
}

export function LetterPageClient({ letter }: LetterPageClientProps) {
  const [items, setItems] = useState<GlossaryItem[]>([])
  const [allItems, setAllItems] = useState<Record<string, GlossaryItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayLetter = letter === "0-9" ? "0-9" : letter.toUpperCase()
  const lookupLetter = letter === "0-9" ? "0" : letter.toUpperCase()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/glossary/letter/${letter}`)

        if (!response.ok) {
          throw new Error(`Failed to load data`)
        }

        const data = await response.json()
        setItems(data.items || [])

        // Build allItems object for cross-references
        const allItemsObj: Record<string, GlossaryItem[]> = {}
        data.items.forEach((item: GlossaryItem) => {
          const itemLetter = item.letter === "0" ? "0" : item.letter
          if (!allItemsObj[itemLetter]) {
            allItemsObj[itemLetter] = []
          }
          allItemsObj[itemLetter].push(item)
        })
        setAllItems(allItemsObj)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load glossary data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [letter])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading {displayLetter} terms...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600 dark:text-red-400">Error loading terms</div>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{displayLetter}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {items.length} {items.length === 1 ? "term" : "terms"}
        </p>
      </div>

      <LetterPageContent items={items} letter={lookupLetter} allItems={allItems} />
    </>
  )
}
