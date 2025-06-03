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

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    // Check if CSV exists, if not use sample data
    if (!fs.existsSync(csvPath)) {
      console.log("CSV not found, using sample data")
      return groupItemsByLetter(SAMPLE_DATA)
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")
    const items: GlossaryItem[] = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const [letter, term, definition, acronym] = line.split(",").map((s) => s.trim())

      if (letter && term && definition) {
        items.push({
          letter: letter.toUpperCase(),
          term,
          definition,
          acronym: acronym || undefined,
        })
      }
    }

    return groupItemsByLetter(items.length > 0 ? items : SAMPLE_DATA)
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
