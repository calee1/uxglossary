"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import type { GlossaryItem } from "@/lib/csv-parser"
import { DiagnosticPanel } from "./diagnostic-panel"
import { DownloadButton } from "./download-button"
import { SetupWizard } from "./setup-wizard"

export default function AdminPage() {
  const router = useRouter()
  const [items, setItems] = useState<GlossaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<GlossaryItem | null>(null)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchGlossaryItems()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check-auth")
      if (!res.ok) {
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/admin/login")
    }
  }

  const fetchGlossaryItems = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/glossary-items")
      if (!res.ok) {
        throw new Error("Failed to fetch glossary items")
      }
      const data = await res.json()
      setItems(data.items || [])
      setIsSetupComplete(true)
    } catch (error) {
      console.error("Error fetching glossary items:", error)
      setError("Failed to load glossary items")
      setIsSetupComplete(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setCurrentItem({
      id: "",
      term: "",
      definition: "",
      acronym: "",
      category: "",
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEditItem = (item: GlossaryItem) => {
    setCurrentItem(item)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDeleteItem = async (item: GlossaryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.term}"?`)) {
      return
    }

    try {
      const res = await fetch("/api/admin/glossary-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          item,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to delete item")
      }

      toast({
        title: "Success",
        description: `"${item.term}" has been deleted.`,
      })

      fetchGlossaryItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentItem) return

    try {
      const action = isEditing ? "update" : "add"
      const res = await fetch("/api/admin/glossary-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          item: currentItem,
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to ${action} item`)
      }

      toast({
        title: "Success",
        description: `"${currentItem.term}" has been ${isEditing ? "updated" : "added"}.`,
      })

      setIsDialogOpen(false)
      fetchGlossaryItems()
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} item:`, error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} item.`,
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout")
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (!isSetupComplete) {
    return <SetupWizard onComplete={() => setIsSetupComplete(true)} />
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchGlossaryItems}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Glossary Admin</h1>
        <div className="flex gap-2">
          <DownloadButton />
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Button onClick={handleAddItem}>Add New Term</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Glossary Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Acronym</TableHead>
                  <TableHead>Definition</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.term}</TableCell>
                    <TableCell>{item.acronym || "-"}</TableCell>
                    <TableCell className="max-w-md truncate">{item.definition}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DiagnosticPanel />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Term" : "Add New Term"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="term">Term</Label>
              <Input
                id="term"
                value={currentItem?.term || ""}
                onChange={(e) => setCurrentItem((prev) => (prev ? { ...prev, term: e.target.value } : null))}
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="acronym">Acronym (optional)</Label>
              <Input
                id="acronym"
                value={currentItem?.acronym || ""}
                onChange={(e) => setCurrentItem((prev) => (prev ? { ...prev, acronym: e.target.value } : null))}
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="definition">Definition</Label>
              <Textarea
                id="definition"
                value={currentItem?.definition || ""}
                onChange={(e) => setCurrentItem((prev) => (prev ? { ...prev, definition: e.target.value } : null))}
                required
                rows={5}
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={currentItem?.category || ""}
                onChange={(e) => setCurrentItem((prev) => (prev ? { ...prev, category: e.target.value } : null))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Add"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
