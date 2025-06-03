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
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    if (!fs.existsSync(csvPath)) {
      const dataDir = path.resolve(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      const defaultContent = `letter,term,definition,acronym,seeAlso
A,API,"Application Programming Interface",API,
B,Backend,"Server-side of an application",,Frontend`

      fs.writeFileSync(csvPath, defaultContent)
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")
    const items: GlossaryItem[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length >= 3) {
        items.push({
          letter: values[0].trim(),
          term: values[1].trim(),
          definition: values[2].trim(),
          acronym: values[3]?.trim() || undefined,
          seeAlso: values[4]?.trim() || undefined,
        })
      }
    }

    const groupedItems: Record<string, GlossaryItem[]> = {}
    items.forEach((item) => {
      let letter = item.letter.toUpperCase()
      if (/^\d/.test(item.term)) {
        letter = "0"
      }
      if (!groupedItems[letter]) {
        groupedItems[letter] = []
      }
      groupedItems[letter].push(item)
    })

    Object.keys(groupedItems).forEach((letter) => {
      groupedItems[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    return groupedItems
  } catch (error) {
    console.error("Error loading glossary data:", error)
    return {}
  }
}

export async function getGlossaryItems(): Promise<GlossaryItem[]> {
  const groupedData = await loadGlossaryData()
  const allItems: GlossaryItem[] = []
  Object.values(groupedData).forEach((items) => {
    allItems.push(...items)
  })
  return allItems
}

export async function getGlossaryItemsByLetter(letter: string): Promise<GlossaryItem[]> {
  const allData = await loadGlossaryData()
  return allData[letter.toUpperCase()] || []
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
