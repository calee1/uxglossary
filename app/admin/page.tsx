"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Settings, Edit3 } from "lucide-react"
import { DiagnosticPanel } from "./diagnostic-panel"
import { DownloadButton } from "./download-button"
import { SetupWizard } from "./setup-wizard"
import { TermManagement } from "./term-management"
import { ThemeToggle } from "@/components/theme-toggle"

type AdminView = "dashboard" | "terms" | "setup"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<AdminView>("dashboard")
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check-auth")
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      localStorage.removeItem("adminAuth")
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const renderContent = () => {
    switch (currentView) {
      case "terms":
        return <TermManagement />
      case "setup":
        return <SetupWizard onComplete={() => setCurrentView("dashboard")} />
      default:
        return (
          <>
            {/* Action Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Content Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                    <Edit3 className="h-5 w-5" />
                    Content Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Manage Terms</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Add, edit, or delete glossary terms directly from the admin interface.
                    </p>
                    <Button onClick={() => setCurrentView("terms")} className="w-full">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Manage Terms
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Download Glossary</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Export the complete glossary as a CSV file for backup or external use.
                    </p>
                    <DownloadButton />
                  </div>
                </CardContent>
              </Card>

              {/* System Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                    <Settings className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">GitHub Integration</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                      Configure GitHub repository for data storage and version control.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setCurrentView("setup")} className="w-full">
                      Setup GitHub Integration
                    </Button>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        View System Logs
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        Clear Cache
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        Run Diagnostics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GitHub Integration Diagnostics */}
            <DiagnosticPanel />

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">System initialized</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Admin dashboard accessed</p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Just now</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Data loaded successfully</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Glossary data parsed and indexed</p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">2 minutes ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Authentication verified</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Admin login successful</p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">5 minutes ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">UX Glossary Admin</h1>
              <div className="flex space-x-1">
                <Button
                  variant={currentView === "dashboard" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant={currentView === "terms" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("terms")}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Terms
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                View Site
              </Link>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>UX Glossary Admin Dashboard • Built with Next.js and Tailwind CSS</p>
        </div>
      </main>
    </div>
  )
}
