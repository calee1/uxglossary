import { NextResponse } from "next/server"
import { getGlossaryData } from "@/lib/simple-parser"

export async function GET() {
  try {
    const data = await getGlossaryData()

    // Get summary counts
    const summary = Object.entries(data).map(([letter, items]) => ({
      letter,
      count: items.length,
    }))

    // Get total count
    const totalCount = Object.values(data).reduce((sum, items) => sum + items.length, 0)

    return NextResponse.json({
      success: true,
      totalCount,
      letterCount: Object.keys(data).length,
      summary,
      // Include sample data for first letter
      sampleData: Object.values(data)[0]?.slice(0, 3) || [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
