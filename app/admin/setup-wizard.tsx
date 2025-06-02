"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Github, ExternalLink, AlertTriangle, Eye, EyeOff } from "lucide-react"

interface SetupWizardProps {
  onComplete: () => void
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [formData, setFormData] = useState({
    githubToken: "",
    githubRepo: "",
    githubBranch: "main",
  })

  const testGitHubConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/test-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const results = await response.json()
      setTestResults(results)

      if (results.success) {
        setStep(3) // Move to success step
      }
    } catch (error) {
      setTestResults({
        success: false,
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Github className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold mb-2">GitHub Integration Setup</h2>
        <p className="text-gray-600">Let's connect your glossary to GitHub for permanent storage</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">What you'll need:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• A GitHub account</li>
          <li>• A repository where you want to store the glossary data</li>
          <li>• A GitHub Personal Access Token with proper permissions</li>
        </ul>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="font-semibold text-yellow-800">Important: Token Requirements</span>
        </div>
        <p className="text-sm text-yellow-700 mb-2">Your GitHub token must:</p>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • Start with <code className="bg-yellow-100 px-1 rounded">ghp_</code> or{" "}
            <code className="bg-yellow-100 px-1 rounded">github_pat_</code>
          </li>
          <li>
            • Have the <strong>"repo"</strong> scope selected
          </li>
          <li>• Not be expired</li>
          <li>• Be copied completely (they're long!)</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => window.open("https://github.com/new", "_blank")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Create Repository
        </Button>
        <Button onClick={() => setStep(2)}>I have a repository →</Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Configure GitHub Connection</h2>
        <p className="text-gray-600">Enter your GitHub repository details</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            GitHub Repository
            <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="username/repository-name"
            value={formData.githubRepo}
            onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: your-username/your-repository-name (e.g., johndoe/my-glossary)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            GitHub Personal Access Token
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={formData.githubToken}
              onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Should start with "ghp_" and be about 40 characters long</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open("https://github.com/settings/tokens/new", "_blank")}
            >
              Create Token
            </Button>
          </div>

          {/* Token validation feedback */}
          {formData.githubToken && (
            <div className="mt-2 text-xs">
              {formData.githubToken.startsWith("ghp_") || formData.githubToken.startsWith("github_pat_") ? (
                <span className="text-green-600">✓ Token format looks correct</span>
              ) : (
                <span className="text-red-600">⚠ Token should start with "ghp_" or "github_pat_"</span>
              )}
              <span className="text-gray-500 ml-2">Length: {formData.githubToken.length} chars</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Branch (optional)</label>
          <Input
            placeholder="main"
            value={formData.githubBranch}
            onChange={(e) => setFormData({ ...formData, githubBranch: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">Default: main (most repositories use 'main' or 'master')</p>
        </div>
      </div>

      {/* Step-by-step token creation guide */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">📝 How to create a GitHub token:</h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            Go to{" "}
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-blue-600"
              onClick={() => window.open("https://github.com/settings/tokens/new", "_blank")}
            >
              GitHub Settings → Personal access tokens
            </Button>
          </li>
          <li>
            Click <strong>"Generate new token (classic)"</strong>
          </li>
          <li>
            Give it a name like <code className="bg-gray-200 px-1 rounded">"UX Glossary Admin"</code>
          </li>
          <li>
            Set expiration (recommend <strong>90 days</strong> or <strong>No expiration</strong>)
          </li>
          <li>
            <strong>Select scopes:</strong>
            <div className="ml-4 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked disabled />
                <strong>repo</strong> - Full control of private repositories
              </div>
              <p className="text-xs text-yellow-700 mt-1">This gives access to read and write to your repositories</p>
            </div>
          </li>
          <li>
            Click <strong>"Generate token"</strong>
          </li>
          <li>
            <strong>⚠️ IMPORTANT:</strong> Copy the token immediately!
            <div className="text-xs text-red-600 mt-1">
              You won't be able to see it again. It should start with "ghp_" and be about 40 characters long.
            </div>
          </li>
        </ol>
      </div>

      {testResults && !testResults.success && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-800">Connection Failed</span>
          </div>
          <p className="text-sm text-red-700 mb-2">{testResults.error}</p>

          {/* Specific 401 error handling */}
          {testResults.error?.includes("401") && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
              <h4 className="font-medium text-red-800 mb-2">🔑 Token Authentication Failed</h4>
              <p className="text-sm text-red-700 mb-2">Your GitHub token is invalid, expired, or copied incorrectly.</p>
              <div className="text-sm text-red-700 space-y-1">
                <p>
                  <strong>Quick fixes to try:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Double-check you copied the entire token (no missing characters)</li>
                  <li>Make sure the token starts with "ghp_" or "github_pat_"</li>
                  <li>Check if the token has expired in your GitHub settings</li>
                  <li>Create a brand new token with "repo" scope</li>
                </ul>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://github.com/settings/tokens", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Check My Tokens
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://github.com/settings/tokens/new", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Create New Token
                </Button>
              </div>
            </div>
          )}

          {testResults.suggestions && (
            <div className="mt-3">
              <h4 className="font-medium text-red-800 mb-1">Suggestions:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {testResults.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          ← Back
        </Button>
        <Button onClick={testGitHubConnection} disabled={!formData.githubRepo || !formData.githubToken || isLoading}>
          {isLoading ? "Testing..." : "Test Connection"}
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
      <div>
        <h2 className="text-2xl font-bold mb-2 text-green-800">Setup Complete!</h2>
        <p className="text-gray-600">Your GitHub integration is working correctly</p>
      </div>

      {testResults && (
        <div className="bg-green-50 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-green-800 mb-2">Connection Details:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Repository: {formData.githubRepo}</li>
            <li>• Branch: {formData.githubBranch}</li>
            <li>• User: {testResults.username}</li>
            <li>• Repository Access: ✓ Confirmed</li>
            <li>• Write Access: ✓ Available</li>
          </ul>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your glossary data will be saved to: data/glossary.csv</li>
          <li>• Changes will automatically commit to your repository</li>
          <li>• Your site will redeploy when changes are made</li>
        </ul>
      </div>

      <Button onClick={onComplete} className="w-full">
        Start Managing Glossary
      </Button>
    </div>
  )

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Setup Wizard</CardTitle>
          <span className="text-sm text-gray-500">Step {step} of 3</span>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </CardContent>
    </Card>
  )
}
