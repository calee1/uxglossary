import fs from "fs"
import path from "path"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
}

// Parse CSV line handling quoted fields
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

// Main function to check for duplicates
async function checkDuplicates() {
  try {
    console.log("Checking for duplicate terms in the glossary...")

    // Load CSV file
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found at:", csvPath)
      return
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    // Skip header row
    const dataLines = lines.slice(1)

    // Parse all items
    const items: GlossaryItem[] = []
    for (const line of dataLines) {
      if (!line.trim()) continue

      const values = parseCSVLine(line)
      if (values.length >= 3) {
        items.push({
          letter: values[0].trim(),
          term: values[1].trim(),
          definition: values[2].trim(),
        })
      }
    }

    console.log(`Loaded ${items.length} items from CSV`)

    // Track unique items and duplicates
    const seen = new Map<string, GlossaryItem[]>() // key: letter+term (lowercase), value: array of matching items

    // Find duplicates
    for (const item of items) {
      const key = `${item.letter.toUpperCase()}:${item.term.toLowerCase()}`

      if (!seen.has(key)) {
        seen.set(key, [])
      }

      seen.get(key)!.push(item)
    }

    // Report duplicates
    let duplicateCount = 0
    const duplicateTerms: string[] = []

    for (const [key, matchingItems] of seen.entries()) {
      if (matchingItems.length > 1) {
        duplicateCount++
        duplicateTerms.push(
          `${matchingItems[0].letter}: ${matchingItems[0].term} (${matchingItems.length} occurrences)`,
        )
      }
    }

    if (duplicateCount === 0) {
      console.log("✅ No duplicates found in the glossary.")
    } else {
      console.log(`⚠️ Found ${duplicateCount} duplicate terms in the glossary:`)
      duplicateTerms.forEach((term) => console.log(`- ${term}`))
    }
  } catch (error) {
    console.error("Error checking duplicates:", error)
  }
}

// Execute the function
checkDuplicates()
