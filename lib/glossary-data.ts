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
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  values.push(current.trim())

  return values.map((val) => {
    const trimmed = val.trim()
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
      return trimmed.slice(1, -1)
    }
    return trimmed
  })
}

export function parseCSV(csvContent: string): GlossaryItem[] {
  const lines = csvContent.trim().split("\n")
  const items: GlossaryItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
      if (values.length >= 3 && values[0] && values[1] && values[2]) {
        items.push({
          letter: values[0].toUpperCase(),
          term: values[1],
          definition: values[2],
          acronym: values[3] || undefined,
        })
      }
    } catch (error) {
      continue
    }
  }
  return items
}

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    if (!fs.existsSync(csvPath)) {
      return {}
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const items = parseCSV(csvContent)
    const grouped: Record<string, GlossaryItem[]> = {}

    for (const item of items) {
      const groupLetter = item.letter === "0" || /^\d/.test(item.term) ? "0" : item.letter
      if (!grouped[groupLetter]) {
        grouped[groupLetter] = []
      }
      grouped[groupLetter].push(item)
    }

    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    return grouped
  } catch (error) {
    return {}
  }
}

export async function getGlossaryItems(): Promise<GlossaryItem[]> {
  const groupedData = await loadGlossaryData()
  return Object.values(groupedData).flat()
}

export async function searchGlossaryItems(query: string): Promise<GlossaryItem[]> {
  const allItems = await getGlossaryItems()
  const lowerQuery = query.toLowerCase()
  return allItems.filter(
    (item) =>
      item.term.toLowerCase().includes(lowerQuery) ||
      item.definition.toLowerCase().includes(lowerQuery) ||
      (item.acronym && item.acronym.toLowerCase().includes(lowerQuery)),
  )
}

export async function getGlossaryItemsByLetter(letter: string): Promise<GlossaryItem[]> {
  try {
    const allData = await loadGlossaryData()
    const lookupLetter = letter === "0-9" ? "0" : letter.toUpperCase()
    return allData[lookupLetter] || []
  } catch (error) {
    console.error("Error in getGlossaryItemsByLetter:", error)
    return []
  }
}
