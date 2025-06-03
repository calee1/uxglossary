import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { letter: string } }) {
  try {
    // Handle both "0-9" and single letters
    const letterParam = params.letter
    const letter = letterParam === "0-9" ? "0" : letterParam.toUpperCase()

    console.log("API: Loading items for letter:", letter, "(from param:", letterParam, ")")

    const { getGlossaryItemsByLetter } = await import("@/lib/csv-parser.server")
    const items = await getGlossaryItemsByLetter(letter)

    console.log("API: Found", items.length, "items for letter", letter)

    return NextResponse.json(items)
  } catch (error) {
    console.error(`API Error fetching glossary items for letter ${params.letter}:`, error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
