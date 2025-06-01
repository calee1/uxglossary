"use client"

import Link from "next/link"
import { DownloadButton } from "./download-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if authenticated via cookie (the middleware should handle this,
    // but this is an extra check for client-side)
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth")
        if (!response.ok) {
          router.push("/admin/login")
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/admin/login")
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Loading admin panel...</p>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-6 border rounded-lg my-8 bg-white">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-500 hover:underline text-sm">
          ← Back to UX Glossary
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage your UX Glossary content and settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Download Section */}
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Download Glossary</h2>
          <p className="text-blue-700 mb-4 text-sm">Download the current glossary as a CSV file to edit offline.</p>
          <DownloadButton />
        </div>

        {/* Upload Section */}
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Update Instructions</h2>
          <div className="text-green-700 text-sm space-y-2">
            <p>
              <strong>1.</strong> Download the CSV file using the button
            </p>
            <p>
              <strong>2.</strong> Edit it in Excel, Google Sheets, or any text editor
            </p>
            <p>
              <strong>3.</strong> Keep the same format: letter,term,definition
            </p>
            <p>
              <strong>4.</strong> Save as CSV format
            </p>
            <p>
              <strong>5.</strong> Replace the file in your project's data/ folder
            </p>
            <p>
              <strong>6.</strong> Redeploy your application
            </p>
          </div>
        </div>

        {/* Current Stats */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Glossary Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">26</div>
              <div className="text-gray-600 text-sm">Letters Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">500+</div>
              <div className="text-gray-600 text-sm">Total Terms</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">19</div>
              <div className="text-gray-600 text-sm">Avg Terms/Letter</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Always backup your current CSV before making changes</li>
          <li>• Maintain the exact CSV format: letter,term,definition</li>
          <li>• Use quotes around definitions that contain commas</li>
          <li>• The letter column should contain single uppercase letters (A-Z)</li>
          <li>• After updating, you'll need to redeploy for changes to take effect</li>
        </ul>
      </div>
    </main>
  )
}
