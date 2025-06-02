"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Github, ExternalLink } from "lucide-react"

interface SetupWizardProps {
  onComplete: () => void
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    githubToken: "",
    githubRepo: "",
    githubBranch: "main",
  })

  const testGitHubConnection = async () => {
    setIsLoading(true)
    try {
      // Test with the provided credentials
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
          <li>• A GitHub Personal Access Token with 'repo' permissions</li>
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
          <Input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={formData.githubToken}
            onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Token must have 'repo' scope permissions</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open("https://github.com/settings/tokens/new", "_blank")}
            >
              Create Token
            </Button>
          </div>
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

      {testResults && !testResults.success && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-800">Connection Failed</span>
          </div>
          <p className="text-sm text-red-700 mb-2">{testResults.error}</p>
          {testResults.suggestions && (
            <ul className="text-sm text-red-700 space-y-1">
              {testResults.suggestions.map((suggestion: string, index: number) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
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
