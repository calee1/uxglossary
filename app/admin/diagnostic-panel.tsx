"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink } from "lucide-react"

export function DiagnosticPanel() {
  const [diagnosis, setDiagnosis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnosis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/diagnose")
      const data = await response.json()
      setDiagnosis(data)
    } catch (error) {
      console.error("Diagnosis failed:", error)
      setDiagnosis({
        error: "Failed to run diagnosis",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (hasIssues: boolean) => {
    if (hasIssues) {
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    }
    return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg dark:text-gray-100">GitHub Integration Diagnostics</CardTitle>
          <Button onClick={runDiagnosis} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Diagnosis
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!diagnosis ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500 dark:text-yellow-400" />
            <p>Click "Run Diagnosis" to check your GitHub integration status</p>
          </div>
        ) : diagnosis.error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-300">Diagnosis Failed</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">{diagnosis.error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div
              className={`p-4 rounded-lg border ${
                diagnosis.issues?.length > 0
                  ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                  : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(diagnosis.issues?.length > 0)}
                <span
                  className={`font-medium ${diagnosis.issues?.length > 0 ? "text-red-800 dark:text-red-300" : "text-green-800 dark:text-green-300"}`}
                >
                  {diagnosis.summary}
                </span>
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <h3 className="font-semibold mb-2 dark:text-gray-200">Environment Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">GitHub Token:</span>
                  <span
                    className={
                      diagnosis.environment?.hasToken
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {diagnosis.environment?.hasToken ? "✓ Set" : "✗ Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">Token Format:</span>
                  <span
                    className={
                      diagnosis.environment?.tokenFormat === "valid"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {diagnosis.environment?.tokenFormat === "valid" ? "✓ Valid" : "✗ Invalid"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">Repository:</span>
                  <span
                    className={
                      diagnosis.environment?.repo
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {diagnosis.environment?.repo || "✗ Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">Branch:</span>
                  <span className="text-gray-600 dark:text-gray-400">{diagnosis.environment?.branch || "main"}</span>
                </div>
              </div>
            </div>

            {/* API Tests */}
            {diagnosis.tests && Object.keys(diagnosis.tests).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 dark:text-gray-200">API Tests</h3>
                <div className="space-y-2 text-sm">
                  {diagnosis.tests.userAccess && (
                    <div className="flex justify-between">
                      <span className="dark:text-gray-300">GitHub User Access:</span>
                      <span
                        className={
                          diagnosis.tests.userAccess.ok
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {diagnosis.tests.userAccess.ok
                          ? `✓ ${diagnosis.tests.userAccess.username}`
                          : `✗ ${diagnosis.tests.userAccess.status}`}
                      </span>
                    </div>
                  )}
                  {diagnosis.tests.repoAccess && (
                    <div className="flex justify-between">
                      <span className="dark:text-gray-300">Repository Access:</span>
                      <span
                        className={
                          diagnosis.tests.repoAccess.ok
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {diagnosis.tests.repoAccess.ok
                          ? `✓ ${diagnosis.tests.repoAccess.name}`
                          : `✗ ${diagnosis.tests.repoAccess.status}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues */}
            {diagnosis.issues && diagnosis.issues.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-red-800 dark:text-red-300">Issues Found</h3>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  {diagnosis.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-300">Recommendations</h3>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  {diagnosis.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://github.com/settings/tokens", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Manage Tokens
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://vercel.com/dashboard", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Vercel Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
