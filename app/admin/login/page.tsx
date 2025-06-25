"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Lock, Eye, EyeOff } from "lucide-react"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("Form submitted with password:", password ? "***" : "empty")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      console.log("Login response status:", response.status)
      const data = await response.json()
      console.log("Login response data:", data)

      if (response.ok) {
        console.log("Login successful, redirecting to admin")
        // Small delay to ensure cookie is set
        setTimeout(() => {
          router.push("/admin")
        }, 100)
      } else {
        console.log("Login failed:", data.error)
        setError(data.error || "Invalid password. Please try again.")
      }
    } catch (err) {
      console.error("Login request failed:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 border rounded-lg my-8 bg-white dark:bg-gray-800">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:underline text-sm">
          ← Back to UX Glossary
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Admin Access</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Please enter your password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-10"
              placeholder="Enter admin password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Login"}
        </Button>
      </form>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          <p className="font-medium mb-1">Debug Info (Development Only):</p>
          <p>Password: l3tm3intogloss@12</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      )}
    </main>
  )
}
