"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WireframeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WireframeModal({ isOpen, onClose }: WireframeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="icon"
          className="absolute -top-2 -right-2 z-10 bg-white hover:bg-gray-100 border-gray-300"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <img
          src="/images/wireframe.png"
          alt="Original wireframe design for the UX Glossary application"
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        />
      </div>
    </div>
  )
}
