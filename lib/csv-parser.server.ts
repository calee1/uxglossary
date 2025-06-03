import "server-only"
import fs from "fs"
import path from "path"

export interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result.map((val) => val.replace(/^"(.*)"$/, "$1"))
}

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    if (!fs.existsSync(csvPath)) {
      console.log("CSV file not found at:", csvPath)
      return {}
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    console.log(`CSV has ${lines.length} lines`)

    if (lines.length < 2) {
      console.log("CSV file is empty or has no data rows")
      return {}
    }

    const items: GlossaryItem[] = []

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)

        if (values.length >= 3) {
          const item: GlossaryItem = {
            letter: values[0] || "",
            term: values[1] || "",
            definition: values[2] || "",
            acronym: values[3] || undefined,
            seeAlso: values[4] || undefined,
          }

          // Only add if we have the essential fields
          if (item.letter && item.term && item.definition) {
            items.push(item)
          }
        }
      } catch (error) {
        console.error(`Error parsing line ${i}:`, error)
      }
    }

    console.log(`Parsed ${items.length} items from CSV`)

    // Group by letter
    const grouped: Record<string, GlossaryItem[]> = {}

    items.forEach((item) => {
      let letter = item.letter.toUpperCase()

      // Handle numeric terms
      if (/^\d/.test(item.term)) {
        letter = "0"
      }

      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(item)
    })

    // Sort within each group
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    console.log(
      "Final grouping:",
      Object.keys(grouped)
        .map((k) => `${k}: ${grouped[k].length}`)
        .join(", "),
    )

    return grouped
  } catch (error) {
    console.error("Error in loadGlossaryData:", error)
    return {}
  }
}

export async function getGlossaryItems(): Promise<GlossaryItem[]> {
  const groupedData = await loadGlossaryData()
  return Object.values(groupedData).flat()
}

export async function getGlossaryItemsByLetter(letter: string): Promise<GlossaryItem[]> {
  const allData = await loadGlossaryData()
  const items = allData[letter.toUpperCase()] || []
  console.log(`getGlossaryItemsByLetter(${letter}) returning ${items.length} items`)
  return items
}

export async function searchGlossaryItems(query: string): Promise<GlossaryItem[]> {
  const allItems = await getGlossaryItems()
  const lowerQuery = query.toLowerCase()
  return allItems.filter(
    (item) =>
      item.term.toLowerCase().includes(lowerQuery) ||
      item.definition.toLowerCase().includes(lowerQuery) ||
      (item.acronym && item.acronym.toLowerCase().includes(lowerQuery)) ||
      (item.seeAlso && item.seeAlso.toLowerCase().includes(lowerQuery)),
  )
}
