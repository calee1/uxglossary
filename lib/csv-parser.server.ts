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

// Sample data removed for brevity

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
      i++
    } else {
      current += char
      i++
    }
  }

  result.push(current.trim())
  return result
}

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    // Check if CSV exists
    if (!fs.existsSync(csvPath)) {
      console.log("CSV not found, using sample data")
      return {}
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")
    const items: GlossaryItem[] = []

    console.log(`Processing ${lines.length} lines from CSV`)

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines

      const values = parseCSVLine(line)

      if (values.length >= 3) {
        // Clean up the values by removing quotes
        const cleanValues = values.map((val) => val.replace(/^"(.*)"$/, "$1").trim())

        // Determine the letter - use the first character of the term
        // If it's a number, use "0"
        let letter = cleanValues[0] || ""

        // If letter field is empty, use first character of term
        if (!letter && cleanValues[1]) {
          const firstChar = cleanValues[1].charAt(0).toUpperCase()
          letter = /^\d/.test(firstChar) ? "0" : firstChar
        }

        const item: GlossaryItem = {
          letter: letter.toUpperCase(),
          term: cleanValues[1] || "",
          definition: cleanValues[2] || "",
          acronym: cleanValues[3] || undefined,
          seeAlso: cleanValues[4] || undefined,
        }

        // Only add if we have required fields
        if (item.letter && item.term && item.definition) {
          items.push(item)
        }
      }
    }

    console.log(`Successfully parsed ${items.length} items`)

    if (items.length === 0) {
      console.log("No items parsed")
      return {}
    }

    // Group items by letter
    const groupedItems: Record<string, GlossaryItem[]> = {}

    items.forEach((item) => {
      let letter = item.letter.toUpperCase()

      // Handle numeric terms
      if (/^\d/.test(item.term)) {
        letter = "0"
      }

      if (!groupedItems[letter]) {
        groupedItems[letter] = []
      }
      groupedItems[letter].push(item)
    })

    // Sort items within each letter group
    Object.keys(groupedItems).forEach((letter) => {
      groupedItems[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    console.log("Grouped items by letter:", Object.keys(groupedItems))
    console.log(
      "Items per letter:",
      Object.fromEntries(Object.entries(groupedItems).map(([letter, items]) => [letter, items.length])),
    )

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
