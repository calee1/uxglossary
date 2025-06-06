import fs from "fs"
import path from "path"
import type { GlossaryItem } from "./csv-parser.server"

// Export parseCSV function for compatibility
export function parseCSV(csvContent: string): GlossaryItem[] {
  const lines = csvContent.trim().split("\n")
  const items: GlossaryItem[] = []

  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)

      if (values.length >= 3 && values[0] && values[1] && values[2]) {
        const letter = values[0].toUpperCase()
        const item: GlossaryItem = {
          letter: letter,
          term: values[1],
          definition: values[2],
          acronym: values[3] || undefined,
        }
        items.push(item)
      }
    } catch (error) {
      console.log(`Parse error on line ${i}:`, error)
    }
  }

  return items
}

// Helper function for parsing CSV lines
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Handle escaped quotes (double quotes within quoted field)
        current += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // Field separator outside of quotes
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  values.push(current.trim())

  // Clean up quoted values - remove surrounding quotes but keep internal content
  return values.map((val) => {
    const trimmed = val.trim()
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
      return trimmed.slice(1, -1) // Remove surrounding quotes
    }
    return trimmed
  })
}

// Export getGlossaryItemsByLetter function
export async function getGlossaryItemsByLetter(letter: string): Promise<GlossaryItem[]> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    if (!fs.existsSync(csvPath)) {
      return []
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const allItems = parseCSV(csvContent)

    // Filter by letter
    return allItems.filter((item) => {
      const groupLetter = item.letter === "0" || /^\d/.test(item.term) ? "0" : item.letter.toUpperCase()
      return groupLetter === letter.toUpperCase()
    })
  } catch (error) {
    console.error("Error getting glossary items by letter:", error)
    return []
  }
}
