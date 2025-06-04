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
  console.log("=== loadGlossaryData START ===")

  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    console.log("CSV path:", csvPath)

    // Check if file exists
    const fileExists = fs.existsSync(csvPath)
    console.log("File exists:", fileExists)

    if (!fileExists) {
      console.log("CSV file not found, returning empty object")
      return {}
    }

    // Read file
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    console.log("CSV content length:", csvContent.length)
    console.log("First 200 chars:", csvContent.substring(0, 200))

    const lines = csvContent.trim().split("\n")
    console.log("Total lines:", lines.length)

    if (lines.length < 2) {
      console.log("CSV file has no data rows")
      return {}
    }

    // Show header
    console.log("Header line:", lines[0])

    const items: GlossaryItem[] = []
    let successfulParses = 0
    let failedParses = 0

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) {
        console.log(`Line ${i}: empty, skipping`)
        continue
      }

      try {
        const values = parseCSVLine(line)
        console.log(`Line ${i}: parsed ${values.length} values:`, values.slice(0, 3))

        if (values.length >= 3) {
          const item: GlossaryItem = {
            letter: values[0] || "",
            term: values[1] || "",
            definition: values[2] || "",
            acronym: values[3] || undefined,
            seeAlso: values[4] || undefined,
          }

          // Validate essential fields
          if (item.letter && item.term && item.definition) {
            items.push(item)
            successfulParses++

            if (i <= 5) {
              // Log first few items
              console.log(`Item ${successfulParses}:`, {
                letter: item.letter,
                term: item.term,
                definition: item.definition.substring(0, 50) + "...",
              })
            }
          } else {
            console.log(`Line ${i}: missing essential fields`, {
              hasLetter: !!item.letter,
              hasTerm: !!item.term,
              hasDefinition: !!item.definition,
            })
            failedParses++
          }
        } else {
          console.log(`Line ${i}: insufficient columns (${values.length})`)
          failedParses++
        }
      } catch (error) {
        console.error(`Error parsing line ${i}:`, error)
        failedParses++
      }
    }

    console.log(`Parsing complete: ${successfulParses} successful, ${failedParses} failed`)

    if (items.length === 0) {
      console.log("No valid items parsed, returning empty object")
      return {}
    }

    // Group by letter
    const grouped: Record<string, GlossaryItem[]> = {}

    items.forEach((item, index) => {
      let letter = item.letter.toUpperCase()

      // Handle numeric terms
      if (/^\d/.test(item.term)) {
        letter = "0"
      }

      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(item)

      if (index < 5) {
        // Log first few groupings
        console.log(`Grouping item ${index + 1}: "${item.term}" -> letter "${letter}"`)
      }
    })

    // Sort within each group
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    const summary = Object.entries(grouped)
      .map(([letter, items]) => `${letter}:${items.length}`)
      .join(", ")
    console.log("Final grouping:", summary)
    console.log("=== loadGlossaryData END ===")

    return grouped
  } catch (error) {
    console.error("=== loadGlossaryData ERROR ===")
    console.error("Error in loadGlossaryData:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack")
    console.log("=== loadGlossaryData ERROR END ===")
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
