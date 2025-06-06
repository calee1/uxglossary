"use client"

import { useState } from "react"
import { Copyright } from "lucide-react"
import { WireframeModal } from "./wireframe-modal"

export function WireframeFooter() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <footer className="py-3 sm:py-4 px-3 sm:px-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-1.5">
          <Copyright className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
          <span>
            copyright{" "}
            <a href="https://calee.me" target="_blank" rel="noopener noreferrer" className="hover:underline">
              calee
            </a>{" "}
            2025
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">|</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline transition-colors"
          >
            wireframe
          </button>
          <span className="text-gray-500 dark:text-gray-400">|</span>
          <span className="text-gray-500 dark:text-gray-400 text-center">
            To help keep this going:{" "}
            <a
              href="https://buymeacoffee.com/calee607"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline transition-colors"
            >
              Buy Me a Coffee
            </a>
          </span>
        </div>
      </footer>
      <WireframeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
