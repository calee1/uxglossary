import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ letter: string }> }) {
  const { letter: letterParam } = await params
  try {
    const letter = letterParam === "0-9" ? "0" : letterParam.toUpperCase()

    console.log("Glossary letter API: Loading items for letter:", letter)

    const { loadGlossaryData } = await import("@/lib/glossary-data")
    const allData = await loadGlossaryData()
    const items = allData[letter] || []

    console.log("Glossary letter API: Found", items.length, "items for letter", letter)

    return NextResponse.json({
      letter: letter,
      items: items,
      allLetters: Object.keys(allData),
      totalItems: Object.values(allData).reduce((sum, items) => sum + items.length, 0),
    })
  } catch (error) {
    console.error(`Glossary letter API error for ${letterParam}:`, error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
