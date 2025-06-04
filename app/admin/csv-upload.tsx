"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadResult {
  success: boolean
  message: string
  added?: number
  updated?: number
  errors?: string[]
}

export function CSVUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find((file) => file.name.endsWith(".csv"))

    if (csvFile) {
      handleFileUpload(csvFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".csv")) {
      handleFileUpload(file)
    }
    // Reset the input
    e.target.value = ""
  }, [])

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("csv", file)

      const response = await fetch("/api/admin/upload-csv", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      setUploadResult(result)
    } catch (error) {
      setUploadResult({
        success: false,
        message: "Failed to upload file. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearResult = () => {
    setUploadResult(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Upload a CSV file to bulk update glossary terms. The CSV should have columns: letter, "term", "definition",
          acronym
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {isDragging ? "Drop your CSV file here" : "Drag and drop your CSV file here"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">or</p>
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Button variant="outline" disabled={isUploading} asChild>
                <span>{isUploading ? "Uploading..." : "Browse Files"}</span>
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <Alert
            className={
              uploadResult.success
                ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                : "border-red-200 bg-red-50 dark:bg-red-900/20"
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="space-y-1">
                  <AlertDescription
                    className={
                      uploadResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                    }
                  >
                    {uploadResult.message}
                  </AlertDescription>
                  {uploadResult.success && (uploadResult.added || uploadResult.updated) && (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      {uploadResult.added && `Added: ${uploadResult.added} terms`}
                      {uploadResult.added && uploadResult.updated && " • "}
                      {uploadResult.updated && `Updated: ${uploadResult.updated} terms`}
                    </div>
                  )}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {uploadResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li>... and {uploadResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearResult} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        {/* CSV Format Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>
              • Header row:{" "}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">letter,"term","definition",acronym</code>
            </li>
            <li>• Letter: Single character (A-Z) or "0" for numbers</li>
            <li>• Term: The glossary term name (must be quoted)</li>
            <li>• Definition: The term definition (must be quoted)</li>
            <li>• Acronym: Optional acronym or abbreviation</li>
            <li>• Terms and definitions should be enclosed in quotes to handle commas and special characters</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
