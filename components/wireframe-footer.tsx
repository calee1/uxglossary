"use client"

import { useState } from "react"
import { Copyright } from "lucide-react"
import { WireframeModal } from "./wireframe-modal"

export function WireframeFooter() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <footer className="py-4 px-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-1.5 text-sm text-gray-900 dark:text-gray-100">
        <Copyright className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span>
          copyright{" "}
          <a href="https://calee.me" target="_blank" rel="noopener noreferrer" className="hover:underline">
            calee
          </a>{" "}
          2025
        </span>
        <span className="text-gray-500 dark:text-gray-400">|</span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline transition-colors"
        >
          wireframe
        </button>
      </footer>
      <WireframeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
