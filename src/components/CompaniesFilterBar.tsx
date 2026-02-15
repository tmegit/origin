"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type Props = {
  cities: string[]
}

export default function CompaniesFilterBar({ cities }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [city, setCity] = useState(searchParams.get("city") ?? "")
  const [formal, setFormal] = useState(searchParams.get("formal") ?? "")
  const [activity, setActivity] = useState(searchParams.get("activity") ?? "")

  const apply = () => {
    const params = new URLSearchParams()

    if (city) params.set("city", city)
    if (formal) params.set("formal", formal)
    if (activity) params.set("activity", activity)

    // reset pagination
    params.set("page", "1")

    router.push(`?${params.toString()}`)
  }

  const reset = () => {
    setCity("")
    setFormal("")
    setActivity("")
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
          className="border rounded px-3 py-2 bg-white"
          placeholder="Ex: La Rochelle"
        />
        <datalist id="cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* FORMALISATION */}
      <div className="flex flex-col text-sm">
        <label className="text-muted-foreground">Formalisation</label>
        <select
          value={formal}
          onChange={(e) => setFormal(e.target.value)}
          className="border rounded px-3 py-2 bg-white"
        >
          <option value="">Toutes</option>
          <option value="formalized">Formalisée</option>
          <option value="detected">Détectée</option>
        </select>
      </div>

      {/* ACTIVITÉ */}
      <div className="flex flex-col text-sm">
        <label className="text-muted-foreground">Activité</label>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="border rounded px-3 py-2 bg-white"
        >
          <option value="">Toutes</option>
          <option value="open">Ouverte</option>
          <option value="closed">Fermée</option>
        </select>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          Filtrer
        </button>
        <button
          onClick={reset}
          className="border px-4 py-2 rounded text-sm bg-white"
        >
          Reset
        </button>
      </div>
    </div>
  )
}