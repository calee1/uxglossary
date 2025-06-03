"use client"

import { useState } from "react"

export default function AdminPage() {
  const [items, setItems] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const openAddDialog = () => {
    setIsAddDialogOpen(true)
  }

  const closeAddDialog = () => {
    setIsAddDialogOpen(false)
  }

  const openEditDialog = (item) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingItem(null)
  }

  const handleAddItem = (newItem) => {
    setItems([...items, newItem])
    closeAddDialog()
  }

  const handleEditItem = (updatedItem) => {
    const updatedItems = items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    setItems(updatedItems)
    closeEditDialog()
  }

  const handleDeleteItem = (id) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        onClick={openAddDialog}
      >
        Add New Item
      </button>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Item</h3>
            <AddItemForm onAddItem={handleAddItem} onClose={closeAddDialog} />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Item</h3>
            <EditItemForm item={editingItem} onEditItem={handleEditItem} onClose={closeEditDialog} />
          </div>
        </div>
      )}

      {/* Item List */}
      {items.length > 0 ? (
        <ul className="list-none p-0">
          {items.map((item) => (
            <li key={item.id} className="border rounded-md p-4 mb-2 dark:bg-gray-700 dark:border-gray-600">
              <span className="block font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
              <div className="mt-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => openEditDialog(item)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No items to display.</p>
      )}
    </div>
  )
}

function AddItemForm({ onAddItem, onClose }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    const newItem = {
      id: Date.now(),
      name: name,
      description: description,
      seeAlso: document.getElementById("seeAlso").value,
    }
    onAddItem(newItem)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="seeAlso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          See Also (comma-separated)
        </label>
        <input
          type="text"
          id="seeAlso"
          name="seeAlso"
          placeholder="Related terms, separated by commas"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="mt-6">
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Add
        </button>
        <button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function EditItemForm({ item, onEditItem, onClose }) {
  const [name, setName] = useState(item?.name || "")
  const [description, setDescription] = useState(item?.description || "")
  const [seeAlso, setSeeAlso] = useState(item?.seeAlso || "")

  const handleSubmit = (e) => {
    e.preventDefault()
    const updatedItem = {
      id: item.id,
      name: name,
      description: description,
      seeAlso: document.getElementById("editSeeAlso").value,
    }
    onEditItem(updatedItem)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="editName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          id="editName"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="editDescription"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="editSeeAlso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          See Also (comma-separated)
        </label>
        <input
          type="text"
          id="editSeeAlso"
          name="seeAlso"
          defaultValue={item?.seeAlso || ""}
          placeholder="Related terms, separated by commas"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="mt-6">
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Update
        </button>
        <button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
