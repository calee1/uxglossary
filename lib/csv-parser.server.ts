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
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

const DEFAULT_CSV_CONTENT = `letter,term,definition,acronym,seeAlso
A,A/B Testing,A method of comparing two versions of a webpage or app to determine which performs better by showing different versions to different users,,
A,Above-the-fold,"The portion of a webpage that is visible without scrolling, derived from newspaper terminology",,
A,Accessibility,The practice of making websites and applications usable by people with disabilities,A11Y,
A,Affordance,The perceived and actual properties of an object that determine how it could be used,,
A,Agile,An iterative approach to project management and software development that emphasizes flexibility and collaboration,,
A,API,Application Programming Interface - a set of rules and protocols that allows different software programs to communicate and exchange data,API,
B,Backend,"The server-side of an application that handles data storage, security, and business logic",,Frontend
B,Bootstrap,"A popular CSS framework for developing responsive and mobile-first websites",,CSS
B,Breadcrumb,A navigation aid that shows users their current location within a website's hierarchy,,Navigation
B,Button,An interactive element that users can click to trigger an action,,
C,Cache,A temporary storage location that stores frequently accessed data for quick retrieval,,
C,CSS,Cascading Style Sheets - a language used to describe the presentation of web pages,CSS,HTML
C,Component,Reusable UI elements that maintain consistency across a design system,,
D,Database,An organized collection of structured information stored electronically,DB,
D,DOM,Document Object Model - a programming interface for web documents,DOM,HTML
D,Design System,A collection of reusable components and guidelines for consistent design,,Component
E,Encryption,The process of converting information into a secret code to prevent unauthorized access,,
E,Event,An action or occurrence that can be detected and handled by a program,,
F,Frontend,The client-side of an application that users interact with directly,,Backend
F,Framework,A platform for developing software applications that provides a foundation of pre-written code,,
G,Grid,A structure of intersecting lines used to organize content and layout,,Layout
H,HTML,HyperText Markup Language - the standard markup language for web pages,HTML,CSS
H,HTTP,HyperText Transfer Protocol - the foundation of data communication on the web,HTTP,
I,Interface,The point where two systems meet and interact,UI,
J,JavaScript,A programming language commonly used for web development,JS,
K,Keyword,A word or phrase that describes the content of a webpage for search engines,,SEO
L,Layout,The arrangement of elements within a design,,Grid
L,Link,A clickable element that navigates to another page or resource,,
M,Mobile-first,A design approach that starts with mobile devices and scales up,,Responsive
N,Navigation,The system that allows users to move through a website or application,,Breadcrumb
O,Optimization,The process of making something as effective or functional as possible,,Performance
P,Prototype,An early model of a product used to test concepts and functionality,,
P,Performance,How fast and efficiently a website or application operates,,Optimization
R,Responsive,Design that adapts to different screen sizes and devices,,Mobile-first
R,Router,A system that determines which content to display based on the URL,,
S,SEO,Search Engine Optimization - improving visibility in search results,SEO,Keyword
S,Server,A computer system that provides data or services to other computers,,Backend
T,Typography,The art and technique of arranging type to make written language readable,,
U,UI,User Interface - the means by which users interact with a computer or application,UI,UX
U,UX,User Experience - the overall experience a person has when using a product,UX,UI
V,Viewport,The visible area of a web page on a user's device,,Responsive
W,Wireframe,A basic structural blueprint showing the layout of a webpage or app,,Prototype
X,XML,eXtensible Markup Language - a markup language for storing and transporting data,XML,
Y,YAML,YAML Ain't Markup Language - a human-readable data serialization standard,YAML,
Z,Z-index,A CSS property that controls the stacking order of elements,Z-index,CSS`

export async function loadGlossaryData(): Promise<Record<string, GlossaryItem[]>> {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    console.log("Loading glossary from:", csvPath)

    // Ensure data directory exists
    const dataDir = path.resolve(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      console.log("Creating data directory...")
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Check if CSV file exists, if not create it
    if (!fs.existsSync(csvPath)) {
      console.log("CSV file not found, creating default...")
      fs.writeFileSync(csvPath, DEFAULT_CSV_CONTENT)
    }

    // Read the CSV file
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    console.log("CSV content length:", csvContent.length)

    const lines = csvContent.trim().split("\n")
    console.log("CSV lines count:", lines.length)

    const items: GlossaryItem[] = []

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines

      const values = parseCSVLine(line)
      if (values.length >= 3) {
        const item: GlossaryItem = {
          letter: values[0] || "",
          term: values[1] || "",
          definition: values[2] || "",
          acronym: values[3] || undefined,
          seeAlso: values[4] || undefined,
        }

        // Only add if we have required fields
        if (item.letter && item.term && item.definition) {
          items.push(item)
        }
      }
    }

    console.log("Parsed items count:", items.length)

    // Group items by letter
    const groupedItems: Record<string, GlossaryItem[]> = {}

    items.forEach((item) => {
      let letter = item.letter.toUpperCase()

      // Handle numeric terms
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

    console.log("Grouped items by letter:", Object.keys(groupedItems))
    console.log(
      "Items per letter:",
      Object.fromEntries(Object.entries(groupedItems).map(([letter, items]) => [letter, items.length])),
    )

    return groupedItems
  } catch (error) {
    console.error("Error loading glossary data:", error)
    return {}
  }
}

export async function getGlossaryItems(): Promise<GlossaryItem[]> {
  const groupedData = await loadGlossaryData()
  const allItems: GlossaryItem[] = []
  Object.values(groupedData).forEach((items) => {
    allItems.push(...items)
  })
  return allItems
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
      (item.acronym && item.acronym.toLowerCase().includes(lowerQuery)) ||
      (item.seeAlso && item.seeAlso.toLowerCase().includes(lowerQuery)),
  )
}
