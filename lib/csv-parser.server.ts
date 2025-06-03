import "server-only"
import fs from "fs"
import path from "path"

export interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
}

const SAMPLE_DATA: GlossaryItem[] = [
  {
    letter: "A",
    term: "A/B Testing",
    definition: "A method of comparing two versions of a webpage or app to determine which performs better",
  },
  {
    letter: "A",
    term: "Accessibility",
    definition: "The practice of making websites and applications usable by people with disabilities",
    acronym: "A11Y",
  },
  {
    letter: "A",
    term: "API",
    definition: "Application Programming Interface - a set of rules for building software applications",
    acronym: "API",
  },
  {
    letter: "B",
    term: "Backend",
    definition: "The server-side of an application that handles data storage and business logic",
  },
  { letter: "B", term: "Bootstrap", definition: "A popular CSS framework for developing responsive websites" },
  {
    letter: "C",
    term: "CSS",
    definition: "Cascading Style Sheets - a language used to describe the presentation of web pages",
    acronym: "CSS",
  },
  {
    letter: "C",
    term: "Component",
    definition: "Reusable UI elements that maintain consistency across a design system",
  },
  {
    letter: "D",
    term: "Database",
    definition: "An organized collection of structured information stored electronically",
  },
  {
    letter: "D",
    term: "Design System",
    definition: "A collection of reusable components and guidelines for consistent design",
  },
  {
    letter: "U",
    term: "UI",
    definition: "User Interface - the means by which users interact with a computer or application",
    acronym: "UI",
  },
  {
    letter: "U",
    term: "UX",
    definition: "User Experience - the overall experience a person has when using a product",
    acronym: "UX",
  },
]

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
      return groupItemsByLetter(SAMPLE_DATA)
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

        const item: GlossaryItem = {
          letter: cleanValues[0] || "",
          term: cleanValues[1] || "",
          definition: cleanValues[2] || "",
          acronym: cleanValues[3] || undefined,
        }

        // Only add if we have required fields
        if (item.letter && item.term && item.definition) {
          items.push(item)
        }
      }
    }

    console.log(`Successfully parsed ${items.length} items`)

    if (items.length === 0) {
      console.log("No items parsed, using sample data")
      return groupItemsByLetter(SAMPLE_DATA)
    }

    return groupItemsByLetter(items)
  } catch (error) {
    console.error("Error loading glossary data:", error)
    return groupItemsByLetter(SAMPLE_DATA)
  }
}

function groupItemsByLetter(items: GlossaryItem[]): Record<string, GlossaryItem[]> {
  const grouped: Record<string, GlossaryItem[]> = {}

  items.forEach((item) => {
    const letter = item.letter.toUpperCase()
    if (!grouped[letter]) {
      grouped[letter] = []
    }
    grouped[letter].push(item)
  })

  // Sort items within each letter
  Object.keys(grouped).forEach((letter) => {
    grouped[letter].sort((a, b) => a.term.localeCompare(b.term))
  })

  return grouped
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
