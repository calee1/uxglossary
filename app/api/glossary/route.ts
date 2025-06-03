import { NextResponse } from "next/server"
import { getGlossaryItems } from "@/lib/csv-parser"

export async function GET() {
  try {
    const items = await getGlossaryItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching glossary items:", error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
