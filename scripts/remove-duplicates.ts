import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { stringify } from "csv-stringify/sync"

interface GlossaryItem {
  id: string
  term: string
  definition: string
  acronym?: string
  category?: string
}

async function removeDuplicates() {
  try {
    const csvFilePath = path.join(process.cwd(), "data/glossary.csv")
    const fileContent = fs.readFileSync(csvFilePath, "utf8")

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as GlossaryItem[]

    // Track terms we've seen
    const seenTerms = new Map<string, string>() // term -> id
    const seenAcronyms = new Map<string, string>() // acronym -> id
    const uniqueRecords: GlossaryItem[] = []
    const removedRecords: GlossaryItem[] = []

    for (const record of records) {
      const term = record.term.toLowerCase()
      const acronym = record.acronym?.toLowerCase()

      // Check if we've seen this term before
      if (seenTerms.has(term)) {
        console.log(`Removing duplicate term: "${record.term}" (ID: ${record.id})`)
        removedRecords.push(record)
        continue
      }

      // Check if we've seen this acronym before (only if it exists)
      if (acronym && seenAcronyms.has(acronym)) {
        console.log(`Removing duplicate acronym: "${record.acronym}" (ID: ${record.id})`)
        removedRecords.push(record)
        continue
      }

      // This is a unique record
      uniqueRecords.push(record)
      seenTerms.set(term, record.id)
      if (acronym) {
        seenAcronyms.set(acronym, record.id)
      }
    }

    // Create backup of original file
    const backupPath = `${csvFilePath}.backup-${Date.now()}`
    fs.copyFileSync(csvFilePath, backupPath)
    console.log(`Backup created at: ${backupPath}`)

    // Write the unique records back to the CSV file
    const csvData = stringify(uniqueRecords, {
      header: true,
      columns: ["id", "term", "definition", "acronym", "category"],
    })

    fs.writeFileSync(csvFilePath, csvData, "utf8")

    console.log(`Removed ${removedRecords.length} duplicate entries.`)
    console.log(`Kept ${uniqueRecords.length} unique entries.`)

    return {
      removed: removedRecords,
      kept: uniqueRecords,
    }
  } catch (error) {
    console.error("Error removing duplicates:", error)
    return {
      removed: [],
      kept: [],
    }
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  removeDuplicates()
}

export { removeDuplicates }
