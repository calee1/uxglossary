import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  const data = await request.formData()
  const file: File | null = data.get("file") as unknown as File

  if (!file) {
    return NextResponse.json({ success: false })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // With the help of the next-s3 package, you can upload directly to S3
  // For more information on how to do that, take a look at this course:
  // https://fireship.io/courses/react-next-firebase/lessons/deploying-nextjs-firebase/

  const filename = file.name

  // Save the file to the public directory
  const filePath = path.join(process.cwd(), "public", filename)
  await writeFile(filePath, buffer)
  console.log(`saved ${filename} to ${filePath}`)

  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const formData = await request.formData()

  const term = formData.get("term") as string
  const definition = formData.get("definition") as string
  const acronym = formData.get("acronym") as string
  const seeAlso = formData.get("seeAlso") as string

  if (!term || !definition) {
    return NextResponse.json({ success: false, error: "Term and definition are required." }, { status: 400 })
  }

  // Construct the CSV row
  const csvRow = `"${term}","${definition}","${acronym || ""}","${seeAlso || ""}"`

  // In a real application, you would update the glossary item in your database or data store.
  // This is a placeholder to demonstrate the concept.
  console.log("Updated glossary item:", csvRow)

  return NextResponse.json({ success: true, data: { term, definition, acronym, seeAlso } })
}
