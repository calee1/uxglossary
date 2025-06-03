import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { stringify } from "csv-stringify/sync"
import { parseCSV, type GlossaryItem } from "@/lib/csv-parser"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const items = await parseCSV("data/glossary.csv")
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching glossary items:", error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { action, item } = data

    if (!action || !item) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const items = await parseCSV("data/glossary.csv")

    if (action === "add") {
      // Generate a new ID
      const newId = Math.max(...items.map((i) => Number.parseInt(i.id)), 0) + 1
      const newItem: GlossaryItem = {
        id: newId.toString(),
        term: item.term,
        definition: item.definition,
        acronym: item.acronym || undefined,
        category: item.category || undefined,
      }
      items.push(newItem)
    } else if (action === "update") {
      const index = items.findIndex((i) => i.id === item.id)
      if (index !== -1) {
        items[index] = {
          ...items[index],
          term: item.term,
          definition: item.definition,
          acronym: item.acronym || undefined,
          category: item.category || undefined,
        }
      } else {
        return NextResponse.json({ error: "Item not found" }, { status: 404 })
      }
    } else if (action === "delete") {
      const index = items.findIndex((i) => i.id === item.id)
      if (index !== -1) {
        items.splice(index, 1)
      } else {
        return NextResponse.json({ error: "Item not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Write back to CSV
    const csvData = stringify(items, {
      header: true,
      columns: ["id", "term", "definition", "acronym", "category"],
    })

    const csvFilePath = path.join(process.cwd(), "data/glossary.csv")
    fs.writeFileSync(csvFilePath, csvData, "utf8")

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Error updating glossary items:", error)
    return NextResponse.json({ error: "Failed to update glossary items" }, { status: 500 })
  }
}
