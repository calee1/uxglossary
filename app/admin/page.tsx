"use client"

import Link from "next/link"
import { DownloadButton } from "./download-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Plus, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<GlossaryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<GlossaryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLetter, setSelectedLetter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GlossaryItem | null>(null)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [letterCounts, setLetterCounts] = useState<Record<string, number>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const router = useRouter()

  // Form state
  const [newItem, setNewItem] = useState<GlossaryItem>({
    letter: "A",
    term: "",
    definition: "",
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth")
        if (!response.ok) {
          router.push("/admin/login")
        } else {
          setIsLoading(false)
          loadGlossaryItems()
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/admin/login")
      }
    }

    checkAuth()
  }, [router])

  const loadGlossaryItems = async () => {
    try {
      console.log("Fetching glossary items...")
      const response = await fetch("/api/admin/glossary-items", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log("Received data:", data)
        console.log("Data type:", typeof data)
        console.log("Data length:", Array.isArray(data) ? data.length : "Not an array")

        setItems(data)
        setFilteredItems(data)
        setLoadError(null)

        // Calculate letter counts
        const counts: Record<string, number> = {}
        data.forEach((item: GlossaryItem) => {
          counts[item.letter] = (counts[item.letter] || 0) + 1
        })
        setLetterCounts(counts)

        console.log(`Successfully loaded ${data.length} glossary items`)
      } else {
        const errorText = await response.text()
        console.error("Failed to load items:", response.status, errorText)
        setLoadError(`Failed to load items: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("Error loading items:", error)
      setLoadError(`Error loading items: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  useEffect(() => {
    let filtered = items

    if (selectedLetter !== "all") {
      filtered = filtered.filter((item) => item.letter === selectedLetter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, selectedLetter])

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.term || !newItem.definition) {
      alert("Please fill in both term and definition")
      return
    }

    try {
      const response = await fetch("/api/admin/glossary-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        await loadGlossaryItems()
        setNewItem({ letter: "A", term: "", definition: "" })
        setIsAddDialogOpen(false)
        alert("Item added successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error adding item: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error adding item:", error)
      alert("Error adding item")
    }
  }

  const handleEditItem = async () => {
    if (!editingItem?.term || !editingItem?.definition) {
      alert("Please fill in both term and definition")
      return
    }

    try {
      const response = await fetch("/api/admin/glossary-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: editingIndex, item: editingItem }),
      })

      if (response.ok) {
        await loadGlossaryItems()
        setEditingItem(null)
        setEditingIndex(-1)
        setIsEditDialogOpen(false)
        alert("Item updated successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error updating item: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error updating item:", error)
      alert("Error updating item")
    }
  }

  const handleDeleteItem = async (index: number, term: string) => {
    if (!confirm(`Are you sure you want to delete "${term}"?`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/glossary-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      })

      if (response.ok) {
        await loadGlossaryItems()
        alert("Item deleted successfully!")
      } else {
        const errorData = await response.json()
        alert(`Error deleting item: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Error deleting item")
    }
  }

  const openEditDialog = (item: GlossaryItem, index: number) => {
    setEditingItem({ ...item })
    setEditingIndex(index)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Loading admin panel...</p>
      </div>
    )
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
  const nonEmptyLetters = letters.filter((letter) => letterCounts[letter] > 0)
  const totalTerms = items.length
  const avgTermsPerLetter = nonEmptyLetters.length > 0 ? Math.round(totalTerms / nonEmptyLetters.length) : 0

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 my-8">
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

      {/* Debug Information */}
      {loadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Debug Information</h3>
          <p className="text-sm text-red-700">{loadError}</p>
          <Button onClick={loadGlossaryItems} className="mt-2 bg-red-600 hover:bg-red-700 text-white" size="sm">
            Retry Loading
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 text-lg">Quick Add</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Term
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Glossary Term</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Letter</label>
                    <Select value={newItem.letter} onValueChange={(value) => setNewItem({ ...newItem, letter: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {letters.map((letter) => (
                          <SelectItem key={letter} value={letter}>
                            {letter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Term</label>
                    <Input
                      value={newItem.term}
                      onChange={(e) => setNewItem({ ...newItem, term: e.target.value })}
                      placeholder="Enter term name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Definition</label>
                    <Textarea
                      value={newItem.definition}
                      onChange={(e) => setNewItem({ ...newItem, definition: e.target.value })}
                      placeholder="Enter definition"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddItem} className="w-full">
                    Add Term
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 text-lg">Download CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <DownloadButton />
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-800 text-lg">Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{nonEmptyLetters.length}</div>
                <div className="text-gray-600 text-sm">Letters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totalTerms}</div>
                <div className="text-gray-600 text-sm">Total Terms</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{avgTermsPerLetter}</div>
                <div className="text-gray-600 text-sm">Avg/Letter</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Manage Existing Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search terms or definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLetter} onValueChange={setSelectedLetter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Letters</SelectItem>
                {letters.map((letter) => (
                  <SelectItem key={letter} value={letter}>
                    {letter} {letterCounts[letter] ? `(${letterCounts[letter]})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const originalIndex = items.findIndex((i) => i.term === item.term && i.letter === item.letter)
                return (
                  <div
                    key={`${item.letter}-${item.term}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                          {item.letter}
                        </span>
                        <span className="font-medium text-gray-900 truncate">{item.term}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.definition}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(item, originalIndex)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItem(originalIndex, item.term)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                {items.length === 0 ? (
                  <div>
                    <p className="mb-2">No glossary terms found.</p>
                    <p className="text-sm">There might be an issue loading the glossary data.</p>
                    {loadError && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <strong>Error details:</strong> {loadError}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No terms found matching your search criteria.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Glossary Term</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Letter</label>
                <Select
                  value={editingItem.letter}
                  onValueChange={(value) => setEditingItem({ ...editingItem, letter: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {letters.map((letter) => (
                      <SelectItem key={letter} value={letter}>
                        {letter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Term</label>
                <Input
                  value={editingItem.term}
                  onChange={(e) => setEditingItem({ ...editingItem, term: e.target.value })}
                  placeholder="Enter term name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Definition</label>
                <Textarea
                  value={editingItem.definition}
                  onChange={(e) => setEditingItem({ ...editingItem, definition: e.target.value })}
                  placeholder="Enter definition"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditItem} className="flex-1">
                  Update Term
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Changes are saved immediately and will be visible on the live site</li>
          <li>• Always backup your glossary using the download feature before making major changes</li>
          <li>• Use the search and filter tools to quickly find specific terms</li>
          <li>• Definitions should be clear and concise for best user experience</li>
        </ul>
      </div>
    </main>
  )
}
