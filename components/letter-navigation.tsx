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
    <div className="flex justify-between items-center py-4 sm:py-6">
      <div className="flex-1">
        {prevLetter && (
          <Link
            href={`/letter/${getLetterUrl(prevLetter)}`}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 rounded-lg transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium">{prevLetter}</span>
          </Link>
        )}
      </div>

      <div className="flex-1 text-center">{/* Empty center - letter title is now handled by LetterPageClient */}</div>

      <div className="flex-1 text-right">
        {nextLetter && (
          <Link
            href={`/letter/${getLetterUrl(nextLetter)}`}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 rounded-lg transition-colors text-sm sm:text-base"
          >
            <span className="font-medium">{nextLetter}</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
