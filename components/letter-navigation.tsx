"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface LetterNavigationProps {
  currentLetter: string
}

export function LetterNavigation({ currentLetter }: LetterNavigationProps) {
  const alphabet = ["0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  // Find current index
  const currentIndex = alphabet.findIndex((letter) => {
    if (currentLetter === "0" || currentLetter === "0-9") return letter === "0-9"
    return letter === currentLetter.toUpperCase()
  })

  const prevLetter = currentIndex > 0 ? alphabet[currentIndex - 1] : null
  const nextLetter = currentIndex < alphabet.length - 1 ? alphabet[currentIndex + 1] : null

  // Convert display letter for URL
  const getLetterUrl = (letter: string) => {
    return letter === "0-9" ? "0-9" : letter.toLowerCase()
  }

  return (
    <div className="flex justify-between items-center py-6">
      <div className="flex-1">
        {prevLetter && (
          <Link
            href={`/letter/${getLetterUrl(prevLetter)}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">{prevLetter}</span>
          </Link>
        )}
      </div>

      <div className="flex-1 text-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentLetter === "0" ? "0-9" : currentLetter.toUpperCase()}
        </span>
      </div>

      <div className="flex-1 text-right">
        {nextLetter && (
          <Link
            href={`/letter/${getLetterUrl(nextLetter)}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <span className="font-medium">{nextLetter}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
