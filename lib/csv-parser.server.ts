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

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    console.log("=== LOAD GLOSSARY DATA START ===")

    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    console.log("CSV path:", csvPath)

    if (!fs.existsSync(csvPath)) {
      console.error("CSV file does not exist at path:", csvPath)
      return {}
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    console.log("CSV loaded - total lines:", lines.length)
    console.log("Header:", lines[0])
    console.log("Sample line 1:", lines[1])
    console.log("Sample line 2:", lines[2])

    if (lines.length < 2) {
      console.error("Not enough lines in CSV")
      return {}
    }

    const grouped: Record<string, GlossaryItem[]> = {}
    let processedCount = 0
    let errorCount = 0

    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        // Simple CSV parsing - handle quotes properly
        const values: string[] = []
        let current = ""
        let inQuotes = false

        for (let j = 0; j < line.length; j++) {
          const char = line[j]

          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === "," && !inQuotes) {
            values.push(current.trim())
            current = ""
          } else {
            current += char
          }
        }
        values.push(current.trim())

        // Remove surrounding quotes
        const cleanValues = values.map((v) => v.replace(/^"(.*)"$/, "$1"))

        if (cleanValues.length >= 3 && cleanValues[0] && cleanValues[1] && cleanValues[2]) {
          const letter = cleanValues[0].toUpperCase()
          const item: GlossaryItem = {
            letter: letter,
            term: cleanValues[1],
            definition: cleanValues[2],
            acronym: cleanValues[3] || undefined,
          }

          // Handle numeric entries
          const groupLetter = letter === "0" || /^\d/.test(item.term) ? "0" : letter

          if (!grouped[groupLetter]) {
            grouped[groupLetter] = []
          }
          grouped[groupLetter].push(item)
          processedCount++

          // Log first few A items for debugging
          if (groupLetter === "A" && grouped[groupLetter].length <= 3) {
            console.log(`A item ${grouped[groupLetter].length}:`, item.term)
          }
        }
      } catch (error) {
        errorCount++
        if (errorCount <= 5) {
          console.log(`Parse error on line ${i}:`, error)
        }
      }
    }

    // Sort items within each group
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.term.localeCompare(b.term))
    })

    console.log("Processing complete:")
    console.log("- Processed items:", processedCount)
    console.log("- Parse errors:", errorCount)
    console.log("- Letters found:", Object.keys(grouped).sort())
    console.log("- A items:", grouped["A"]?.length || 0)
    console.log("- B items:", grouped["B"]?.length || 0)
    console.log("- C items:", grouped["C"]?.length || 0)

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
