import fs from "fs"
import path from "path"

export interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string // New field for related terms
}

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    // Use path.resolve to ensure we're getting the correct absolute path
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    // Check if file exists before trying to read it
    if (!fs.existsSync(csvPath)) {
      console.warn(`Glossary CSV file not found at: ${csvPath}`)
      // Create the directory if it doesn't exist
      const dataDir = path.resolve(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      // Create a default CSV file with headers and sample data including acronyms and seeAlso
      const defaultCsvContent = `letter,term,definition,acronym,seeAlso
A,Algorithm,"A step-by-step procedure for solving a problem or completing a task",,
A,API,"Application Programming Interface - a set of protocols and tools for building software applications",API,
B,Backend,"The server-side of an application that handles data storage, security, and business logic",,Frontend
B,Bootstrap,"A popular CSS framework for developing responsive and mobile-first websites",,
C,Cache,"A temporary storage location that stores frequently accessed data for quick retrieval",,
C,CSS,"Cascading Style Sheets - a language used to describe the presentation of web pages",CSS,HTML
D,Database,"An organized collection of structured information stored electronically",DB,
D,DOM,"Document Object Model - a programming interface for web documents",DOM,HTML
E,Encryption,"The process of converting information into a secret code to prevent unauthorized access",,
E,Event,"An action or occurrence that can be detected and handled by a program",,`

      fs.writeFileSync(csvPath, defaultCsvContent)
      console.log(`Created default glossary CSV file at: ${csvPath}`)
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")

    // Parse CSV content
    const lines = csvContent.trim().split("\n")
    const headers = lines[0].split(",")

    const items: GlossaryItem[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length >= 3) {
        items.push({
          letter: values[0].trim(),
          term: values[1].trim(),
          definition: values[2].trim(),
          acronym: values[3]?.trim() || undefined,
          seeAlso: values[4]?.trim() || undefined, // Add seeAlso support
        })
      }
    }

    // Group items by letter
    const groupedItems: Record<string, GlossaryItem[]> = {}

    items.forEach((item) => {
      let letter = item.letter.toUpperCase()

      // Group all numeric terms under "0"
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

    return groupedItems
  } catch (error) {
    console.error("Error loading glossary data:", error)
    // Return empty object instead of throwing an error
    return {}
  }
}

// Get data for a specific letter
export async function loadLetterData(letter: string): Promise<GlossaryItem[]> {
  const allData = await loadGlossaryData()
  return allData[letter.toUpperCase()] || []
}

// Get all glossary items as a flat array
export async function getGlossaryItems(): Promise<GlossaryItem[]> {
  const groupedData = await loadGlossaryData()
  const allItems: GlossaryItem[] = []

  Object.values(groupedData).forEach((items) => {
    allItems.push(...items)
  })

  return allItems
}

// Get glossary items by letter
export async function getGlossaryItemsByLetter(letter: string): Promise<GlossaryItem[]> {
  return loadLetterData(letter)
}

// Search glossary items
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

// Simple CSV line parser that handles quoted fields
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

// Export parseCSV function for admin use
export function parseCSV(csvContent: string): GlossaryItem[] {
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

  return items
}

// Create a slug from a term for anchor links
export function createTermSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}
