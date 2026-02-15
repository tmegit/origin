"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

type Props = { cities: string[] }

export default function FilterBar({ cities }: Props) {

  const router = useRouter()
  const sp = useSearchParams()

  const [city, setCity] = useState(sp.get("city") ?? "")
  const [from, setFrom] = useState(sp.get("from") ?? "")
  const [to, setTo] = useState(sp.get("to") ?? "")

  const cityOptions = useMemo(
    () => (Array.isArray(cities) ? cities.filter(Boolean) : []),
    [cities]
  )

  const apply = () => {
    const params = new URLSearchParams()
    if (city) params.set("city", city)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex items-end gap-4">

      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground">Ville</label>
        <input
          list="cities-list-unique"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="La Rochelle…"
          className="border rounded px-2 py-1 text-sm w-[220px]"
        />
        <datalist id="cities-list-unique">
          {cityOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground">Du</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground">Au</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      <button
        onClick={apply}
        className="bg-black text-white px-4 py-2 rounded text-sm"
      >
        Filtrer
      </button>
    </div>
  )
}