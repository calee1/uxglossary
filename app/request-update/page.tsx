import { RequestForm } from "./request-form"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function RequestUpdatePage() {
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg my-4 sm:my-8 bg-white dark:bg-gray-800 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">UX Glossary</h1>
          <span className="text-base sm:text-lg mt-1 md:mt-0 text-gray-900 dark:text-gray-100">
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

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Request an Update</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Help improve this glossary by suggesting new terms, corrections, or updates to existing definitions.
        </p>
      </div>

      <RequestForm />

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">What happens next?</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Your request will be emailed to c***7@gmail.com for review</li>
          <li>• We'll contact you directly using the email you provided</li>
          <li>• Updates are typically processed within 5-7 business days</li>
          <li>• You'll receive a confirmation email once changes are made</li>
        </ul>
      </div>
    </main>
  )
}
