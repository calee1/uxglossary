import Link from "next/link"
import { getGlossaryData } from "@/lib/simple-parser"

export default async function SimpleHomePage() {
  const data = await getGlossaryData()
  const letters = Object.keys(data).sort()

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6">Simple Glossary</h1>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <strong>Debug:</strong> Found {letters.length} letters with data
      </div>

      <div className="grid grid-cols-6 gap-4">
        {letters.map((letter) => (
          <Link
            key={letter}
            href={`/simple/${letter === "0" ? "0-9" : letter.toLowerCase()}`}
            className="p-4 bg-blue-100 text-center rounded hover:bg-blue-200"
          >
            <span className="text-xl font-bold">{letter === "0" ? "0-9" : letter}</span>
            <div className="text-sm mt-1">({data[letter].length})</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
