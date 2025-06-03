import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

interface GlossaryItem {
  id: string
  term: string
  definition: string
  acronym?: string
  category?: string
}

async function checkDuplicates() {
  try {
    const csvFilePath = path.join(process.cwd(), "data/glossary.csv")
    const fileContent = fs.readFileSync(csvFilePath, "utf8")

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as GlossaryItem[]

    // Check for duplicate terms
    const terms = new Map<string, GlossaryItem[]>()

    records.forEach((record) => {
      const term = record.term.toLowerCase()
      if (!terms.has(term)) {
        terms.set(term, [])
      }
      terms.get(term)!.push(record)
    })

    // Check for duplicate acronyms
    const acronyms = new Map<string, GlossaryItem[]>()

    records.forEach((record) => {
      if (record.acronym) {
        const acronym = record.acronym.toLowerCase()
        if (!acronyms.has(acronym)) {
          acronyms.set(acronym, [])
        }
        acronyms.get(acronym)!.push(record)
      }
    })

    let hasDuplicates = false

    // Report duplicate terms
    for (const [term, items] of terms.entries()) {
      if (items.length > 1) {
        hasDuplicates = true
        console.log(`Duplicate term found: "${term}"`)
        items.forEach((item) => {
          console.log(`  ID: ${item.id}, Definition: ${item.definition.substring(0, 50)}...`)
        })
      }
    }

    // Report duplicate acronyms
    for (const [acronym, items] of acronyms.entries()) {
      if (items.length > 1) {
        hasDuplicates = true
        console.log(`Duplicate acronym found: "${acronym}"`)
        items.forEach((item) => {
          console.log(`  ID: ${item.id}, Term: ${item.term}`)
        })
      }
    }

    if (!hasDuplicates) {
      console.log("No duplicates found.")
    }

    return hasDuplicates
  } catch (error) {
    console.error("Error checking duplicates:", error)
    return false
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  checkDuplicates()
}

export { checkDuplicates }
