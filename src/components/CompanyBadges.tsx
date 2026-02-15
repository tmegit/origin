"use client"

export function FormalStatusBadge({ value }: { value?: string | null }) {
  const v = (value ?? "").toLowerCase()
  const isFormalized = v === "formalized"

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        isFormalized
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {isFormalized ? "Formalisée" : "Détectée"}
    </span>
  )
}

export function ActivityStatusBadge({ value }: { value?: string | null }) {
  const v = (value ?? "").toLowerCase()
  const isOpen = v === "open"

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {isOpen ? "Ouverte" : "Fermée"}
    </span>
  )
}