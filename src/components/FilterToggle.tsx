"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"

export default function FilterToggle({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
      >
        <SlidersHorizontal size={16} />
        Filtres
      </button>

      {open && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          {children}
        </div>
      )}
    </div>
  )
}