import fs from "fs"
import path from "path"

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = []
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

// Convert item to CSV line with proper escaping
function itemToCSVLine(item) {
  const escapedDefinition =
    item.definition.includes(",") || item.definition.includes('"') || item.definition.includes("\n")
      ? `"${item.definition.replace(/"/g, '""')}"`
      : item.definition

  return `${item.letter},${item.term},${escapedDefinition}`
}

// Load and process the CSV file
const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

console.log("Loading glossary data...")
const csvContent = fs.readFileSync(csvPath, "utf-8")
const lines = csvContent.trim().split("\n")

// Skip header row
const headerLine = lines[0]
const dataLines = lines.slice(1)

// Parse all items
const items = []
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
const uniqueItems = []
const duplicates = []
const seen = new Map() // key: letter+term (lowercase), value: index in uniqueItems

// Find duplicates
for (const item of items) {
  const key = `${item.letter.toUpperCase()}:${item.term.toLowerCase()}`

  if (seen.has(key)) {
    duplicates.push(item)
    console.log(`Found duplicate: ${item.letter} - ${item.term}`)
  } else {
    seen.set(key, uniqueItems.length)
    uniqueItems.push(item)
  }
}

console.log(`Found ${duplicates.length} duplicates`)

if (duplicates.length === 0) {
  console.log("No duplicates found. No changes needed.")
} else {
  // Sort items by letter and term
  uniqueItems.sort((a, b) => {
    if (a.letter !== b.letter) {
      return a.letter.localeCompare(b.letter)
    }
    return a.term.localeCompare(b.term)
  })

  // Create new CSV content
  let newCsvContent = headerLine + "\n"
  for (const item of uniqueItems) {
    newCsvContent += itemToCSVLine(item) + "\n"
  }

  // Write back to file
  fs.writeFileSync(csvPath, newCsvContent)

  console.log(`Successfully removed ${duplicates.length} duplicates. New item count: ${uniqueItems.length}`)
  console.log("Duplicates removed:")
  duplicates.forEach((item) => console.log(`- ${item.letter}: ${item.term}`))
}
