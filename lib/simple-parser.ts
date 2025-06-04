import fs from "fs"
import path from "path"

export interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
}

export async function getGlossaryData() {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "data", "glossary.csv")
    const fileContent = fs.readFileSync(csvPath, "utf8")

    // Split into lines and skip header
    const lines = fileContent.trim().split("\n")
    const dataLines = lines.slice(1)

    // Parse each line
    const items: GlossaryItem[] = []

    for (const line of dataLines) {
      if (!line.trim()) continue

      // Simple CSV parsing - this handles most cases but not escaped quotes
      const parts = line.split(",")

      if (parts.length >= 3) {
        items.push({
          letter: parts[0].trim(),
          term: parts[1].trim(),
          definition: parts[2].trim(),
          acronym: parts.length > 3 ? parts[3].trim() : undefined,
        })
      }
    }

    // Group by letter
    const grouped: Record<string, GlossaryItem[]> = {}

    for (const item of items) {
      const letter = item.letter.toUpperCase()

      if (!grouped[letter]) {
        grouped[letter] = []
      }

      grouped[letter].push(item)
    }

    return grouped
  } catch (error) {
    console.error("Error loading glossary data:", error)
    return {}
  }
}

export async function getItemsByLetter(letter: string) {
  const data = await getGlossaryData()
  return data[letter.toUpperCase()] || []
}
