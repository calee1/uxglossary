"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { useState } from "react"

export function DownloadButton() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Fetch the CSV file from the server
      const response = await fetch("/api/download-glossary")

      if (!response.ok) {
        throw new Error("Failed to download glossary")
      }

      // Get the CSV content
      const csvContent = await response.text()

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link and click it
      const link = document.createElement("a")
      link.href = url
      link.download = `ux-glossary-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download glossary. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isDownloading ? (
          <>
            <FileText className="w-4 h-4 mr-2 animate-pulse" />
            Preparing Download...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download Glossary CSV
          </>
        )}
      </Button>

      <p className="text-xs text-blue-600">
        File will be saved as: ux-glossary-{new Date().toISOString().split("T")[0]}.csv
      </p>
    </div>
  )
}
