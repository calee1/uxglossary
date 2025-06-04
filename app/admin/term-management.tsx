"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Search, Save, X } from "lucide-react"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
  seeAlso?: string
}

export function TermManagement() {
  const [terms, setTerms] = useState<GlossaryItem[]>([])
  const [filteredTerms, setFilteredTerms] = useState<GlossaryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingTerm, setEditingTerm] = useState<GlossaryItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTerm, setNewTerm] = useState<GlossaryItem>({
    letter: "",
    term: "",
    definition: "",
    acronym: "",
  })

  useEffect(() => {
    loadTerms()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = terms.filter(
        (term) =>
          term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (term.acronym && term.acronym.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredTerms(filtered)
    } else {
      setFilteredTerms(terms)
    }
  }, [searchQuery, terms])

  const loadTerms = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/glossary")
      if (response.ok) {
        const data = await response.json()
        setTerms(data)
        setFilteredTerms(data)
      }
    } catch (error) {
      console.error("Failed to load terms:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTerm = async () => {
    try {
      // Determine letter from term
      const firstChar = newTerm.term.charAt(0).toUpperCase()
      const letter = /\d/.test(firstChar) ? "0" : firstChar

      const termToAdd = {
        ...newTerm,
        letter,
        term: newTerm.term.trim(),
        definition: newTerm.definition.trim(),
        acronym: newTerm.acronym?.trim() || undefined,
        seeAlso: newTerm.seeAlso?.trim() || undefined,
      }

      const response = await fetch("/api/admin/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(termToAdd),
      })

      if (response.ok) {
        await loadTerms()
        setShowAddForm(false)
        setNewTerm({ letter: "", term: "", definition: "", acronym: "" })
      } else {
        alert("Failed to add term")
      }
    } catch (error) {
      console.error("Error adding term:", error)
      alert("Error adding term")
    }
  }

  const handleEditTerm = async () => {
    if (!editingTerm) return

    try {
      const response = await fetch("/api/admin/terms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTerm),
      })

      if (response.ok) {
        await loadTerms()
        setEditingTerm(null)
      } else {
        alert("Failed to update term")
      }
    } catch (error) {
      console.error("Error updating term:", error)
      alert("Error updating term")
    }
  }

  const handleDeleteTerm = async (term: GlossaryItem) => {
    if (!confirm(`Are you sure you want to delete "${term.term}"?`)) return

    try {
      const response = await fetch("/api/admin/terms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: term.term, letter: term.letter }),
      })

      if (response.ok) {
        await loadTerms()
      } else {
        alert("Failed to delete term")
      }
    } catch (error) {
      console.error("Error deleting term:", error)
      alert("Error deleting term")
    }
  }

  const TermForm = ({
    term,
    onChange,
    onSave,
    onCancel,
    title,
  }: {
    term: GlossaryItem
    onChange: (field: keyof GlossaryItem, value: string) => void
    onSave: () => void
    onCancel: () => void
    title: string
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Term *</label>
          <Input value={term.term} onChange={(e) => onChange("term", e.target.value)} placeholder="Enter term name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Definition *</label>
          <Textarea
            value={term.definition}
            onChange={(e) => onChange("definition", e.target.value)}
            placeholder="Enter definition"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Acronym (optional)</label>
          <Input
            value={term.acronym || ""}
            onChange={(e) => onChange("acronym", e.target.value)}
            placeholder="e.g., UX, API, CSS"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!term.term.trim() || !term.definition.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading terms...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Term Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Add, edit, or delete glossary terms</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Term
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <TermForm
          term={newTerm}
          onChange={(field, value) => setNewTerm({ ...newTerm, [field]: value })}
          onSave={handleAddTerm}
          onCancel={() => {
            setShowAddForm(false)
            setNewTerm({ letter: "", term: "", definition: "", acronym: "" })
          }}
          title="Add New Term"
        />
      )}

      {/* Edit Form */}
      {editingTerm && (
        <TermForm
          term={editingTerm}
          onChange={(field, value) => setEditingTerm({ ...editingTerm, [field]: value })}
          onSave={handleEditTerm}
          onCancel={() => setEditingTerm(null)}
          title="Edit Term"
        />
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTerms.length} of {terms.length} terms
          </div>
        </CardContent>
      </Card>

      {/* Terms List */}
      <Card>
        <CardHeader>
          <CardTitle>All Terms ({filteredTerms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTerms.map((term, index) => (
              <div
                key={`${term.letter}-${term.term}-${index}`}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {term.letter === "0" ? "0-9" : term.letter}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{term.term}</span>
                    {term.acronym && <span className="text-sm text-gray-500 dark:text-gray-400">({term.acronym})</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{term.definition}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTerm({ ...term })}
                    disabled={!!editingTerm}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTerm(term)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filteredTerms.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? `No terms found matching "${searchQuery}"` : "No terms available"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
