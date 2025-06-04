import Link from "next/link"
import { notFound } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LetterPageClient } from "./letter-page-client"

interface LetterPageProps {
  params: {
    letter: string
  }
}

export default function LetterPage({ params }: LetterPageProps) {
  const letter = params.letter === "0-9" ? "0" : params.letter.toUpperCase()
  const alphabet = ["0", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))]

  if (!alphabet.includes(letter)) {
    notFound()
  }

  return (
    <main className="max-w-4xl mx-auto p-6 border border-gray-200 dark:border-gray-700 rounded-lg my-8 bg-white dark:bg-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-baseline gap-3">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">UX Glossary</h1>
          <span className="text-lg text-gray-900 dark:text-gray-100">
            By:{" "}
            <Link href="http://calee.me/" className="text-blue-500 dark:text-blue-400 hover:underline">
              calee
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <Link href="/" className="text-blue-500 dark:text-blue-400 hover:underline">
            Home
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/request-update" className="text-blue-500 dark:text-blue-400 hover:underline">
            Request an Update
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/admin" className="text-blue-500 dark:text-blue-400 hover:underline">
            Admin
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <ThemeToggle />
        </div>
      </div>

      <LetterPageClient letter={params.letter} />

      <div className="mt-12 text-center">
        <Link href="/" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          Back to All Letters
        </Link>
      </div>
    </main>
  )
}
