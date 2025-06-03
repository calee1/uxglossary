import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("API: Loading glossary items...")
    const { getGlossaryItems } = await import("@/lib/csv-parser.server")
    const items = await getGlossaryItems()
    console.log("API: Loaded", items.length, "items")
    return NextResponse.json(items)
  } catch (error) {
    console.error("API Error fetching glossary items:", error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
