"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type Props = {
  cities: string[]
  showStatus?: boolean
}

export default function FilterBar({
  cities,
  showStatus = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [city, setCity] = useState(searchParams.get("city") ?? "")
  const [from, setFrom] = useState(searchParams.get("from") ?? "")
  const [to, setTo] = useState(searchParams.get("to") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (city) params.set("city", city)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (showStatus && status) params.set("status", status)

    router.push(`?${params.toString()}`)
  }

  const resetFilters = () => {
    setCity("")
    setFrom("")
    setTo("")
    setStatus("")
    router.push("?")
  }

  return (
    <div className="flex gap-4 items-end flex-wrap">

      {/* VILLE */}
      <div className="flex flex-col text-sm">
        <label className="text-muted-foreground">Ville</label>
        <input
          list="cities"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Ex: La Rochelle"
        />
        <datalist id="cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* DATE FROM */}
      <div className="flex flex-col text-sm">
        <label className="text-muted-foreground">Du</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* DATE TO */}
      <div className="flex flex-col text-sm">
        <label className="text-muted-foreground">Au</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* STATUT (optionnel) */}
      {showStatus && (
        <div className="flex flex-col text-sm">
          <label className="text-muted-foreground">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Tous</option>
            <option value="validated">Validé</option>
            <option value="pending">En attente</option>
            <option value="late">En retard</option>
          </select>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          Filtrer
        </button>

        <button
          onClick={resetFilters}
          className="border px-4 py-2 rounded text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  )
}