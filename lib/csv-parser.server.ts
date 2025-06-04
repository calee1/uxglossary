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
    console.log("=== LOAD GLOSSARY DATA START ===")

    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    console.log("CSV path:", csvPath)

    if (!fs.existsSync(csvPath)) {
      console.error("CSV file does not exist at path:", csvPath)
      console.log("Current directory:", process.cwd())
      console.log("Directory contents:", fs.readdirSync(process.cwd()))
      return {}
    }

    console.log("Reading CSV file...")
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    console.log("CSV content length:", csvContent.length)
    console.log("First 200 chars:", csvContent.substring(0, 200))

    const lines = csvContent.trim().split("\n")
    console.log("Total lines:", lines.length)

    if (lines.length < 2) {
      console.error("Not enough lines in CSV, only found:", lines.length)
      return {}
    }

    const items: GlossaryItem[] = []
    console.log("Processing lines...")

    // Process each data line (skip header at index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)

        // Your CSV has 4 columns: letter,term,definition,acronym
        if (values.length >= 3) {
          const item: GlossaryItem = {
            letter: values[0] || "",
            term: values[1] || "",
            definition: values[2] || "",
            acronym: values[3] || undefined,
          }

          // Clean up empty strings
          if (item.acronym === "") item.acronym = undefined

          // Validate essential fields
          if (item.letter && item.term && item.definition) {
            items.push(item)
          } else {
            console.log(`Line ${i}: Missing essential fields`, item)
          }
        } else {
          console.log(`Line ${i}: Not enough values (${values.length})`)
        }
      } catch (error) {
        console.log(`Line ${i}: Parse error:`, error)
        continue
      }
    }

    console.log("Total valid items parsed:", items.length)

    if (items.length === 0) {
      console.error("No valid items found in CSV")
      return {}
    }

    // Group by letter
    const grouped: Record<string, GlossaryItem[]> = {}

    items.forEach((item) => {
      let letter = item.letter.toUpperCase()

      // Handle numeric terms - if letter is "0" OR term starts with number, group under "0"
      if (letter === "0" || /^\d/.test(item.term)) {
        letter = "0"
      }

      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(item)
    })

    // Sort items within each letter group
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    console.log("Final grouped data:", Object.keys(grouped))
    console.log(
      "Letter counts:",
      Object.keys(grouped)
        .map((letter) => `${letter}: ${grouped[letter].length}`)
        .join(", "),
    )
    console.log("=== LOAD GLOSSARY DATA END ===")

    return grouped
  } catch (error) {
    console.error("Load glossary data error:", error)
    return {}
  }
}

export async function getGlossaryItems(): Promise<GlossaryItem[]> {
  const groupedData = await loadGlossaryData()
  return Object.values(groupedData).flat()
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
      (item.acronym && item.acronym.toLowerCase().includes(lowerQuery)),
  )
}
