"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type Props = {
  cities: string[]
}

export default function FilterBar({ cities }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [city, setCity] = useState(searchParams.get("city") || "")
  const [from, setFrom] = useState(searchParams.get("from") || "")
  const [to, setTo] = useState(searchParams.get("to") || "")

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (city) params.set("city", city)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex gap-3 items-end">

      <div>
        <label className="text-xs text-gray-500">Ville</label>
        <input
          list="cities"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <datalist id="cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="text-xs text-gray-500">Du</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500">Au</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={applyFilters}
        className="bg-black text-white px-4 py-2 rounded text-sm"
      >
        Filtrer
      </button>
    </div>
  )
}