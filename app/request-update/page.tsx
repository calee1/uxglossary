import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { RequestForm } from "./request-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Request an Update - UX Glossary",
  description:
    "Request updates, corrections, or new terms for the UX Glossary. Help us improve our comprehensive collection of user experience definitions.",
  openGraph: {
    title: "Request an Update - UX Glossary",
    description:
      "Request updates, corrections, or new terms for the UX Glossary. Help us improve our comprehensive collection of user experience definitions.",
    url: "https://uxglossary.vercel.app/request-update",
  },
  twitter: {
    title: "Request an Update - UX Glossary",
    description:
      "Request updates, corrections, or new terms for the UX Glossary. Help us improve our comprehensive collection of user experience definitions.",
  },
  alternates: {
    canonical: "https://uxglossary.vercel.app/request-update",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RequestUpdatePage() {
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
          <span className="text-gray-500 dark:text-gray-400">Request an Update</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="/admin" className="text-blue-500 dark:text-blue-400 hover:underline">
            Admin
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Request an Update</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Help us improve the UX Glossary by suggesting new terms, corrections, or updates to existing definitions. Your
          contributions help make this resource better for the entire UX community.
        </p>
      </div>

      <RequestForm />
    </main>
  )
}
