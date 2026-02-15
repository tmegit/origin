"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [city, setCity] = useState(searchParams.get("city") ?? "")
  const [from, setFrom] = useState(searchParams.get("from") ?? "")
  const [to, setTo] = useState(searchParams.get("to") ?? "")

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (city) params.set("city", city)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex items-end gap-4">
      <div className="flex flex-col">
        <label className="text-xs">Ville</label>
        <input
          className="border px-2 py-1 rounded"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="La Rochelle"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs">Du</label>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs">Au</label>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button
        onClick={applyFilters}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Filtrer
      </button>
    </div>
  )
}