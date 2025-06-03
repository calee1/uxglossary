"use client"

interface HighlightedTextProps {
  text: string
  searchTerm?: string
  highlight?: string
  className?: string
}

export function HighlightedText({ text, searchTerm, highlight, className = "" }: HighlightedTextProps) {
  const query = searchTerm || highlight || ""

  if (!query.trim()) {
    return <span className={className}>{text}</span>
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  )
}
