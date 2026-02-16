"use client"

import { useEffect, useMemo, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

type ResultItem =
  | { type: "company"; id: string; label: string }
  | { type: "director"; id: string; label: string }
  | { type: "transaction"; id: string; label: string }

function isUuid(v: string) {
  // uuid v4-ish, mais on accepte large
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  )
}

export default function GlobalSearch() {
  const router = useRouter()

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // petit debounce
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setErrMsg(null)
      return
    }

    const t = setTimeout(() => {
      void runSearch(q)
    }, 250)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function runSearch(q: string) {
    setLoading(true)
    setErrMsg(null)

    const qIsUuid = isUuid(q)

    // ------------------------
    // ENTREPRISES
    // ------------------------
    const [companiesByNameRes, companiesByIdRes] = await Promise.all([
      supabase
        .from("companies")
        .select("id_temp, company_name")
        .ilike("company_name", `%${q}%`)
        .limit(5),
      qIsUuid
        ? supabase
            .from("companies")
            .select("id_temp, company_name")
            .eq("id_temp", q)
            .limit(1)
        : Promise.resolve({ data: [], error: null } as any),
    ])

    // ------------------------
    // DIRECTEURS
    // ------------------------
    const [directorsByNameRes, directorsByIdRes] = await Promise.all([
      supabase
        .from("directors")
        .select("id_director, first_name, last_name")
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(5),
      qIsUuid
        ? supabase
            .from("directors")
            .select("id_director, first_name, last_name")
            .eq("id_director", q)
            .limit(1)
        : Promise.resolve({ data: [], error: null } as any),
    ])

    // ------------------------
    // TRANSACTIONS
    // ------------------------
    const [txByTextRes, txByIdRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id_transaction, type_details")
        .ilike("type_details", `%${q}%`)
        .limit(5),
      qIsUuid
        ? supabase
            .from("transactions")
            .select("id_transaction, type_details")
            .eq("id_transaction", q)
            .limit(1)
        : Promise.resolve({ data: [], error: null } as any),
    ])

    // remonter les erreurs au lieu de les ignorer
    const errors = [
      companiesByNameRes.error,
      companiesByIdRes.error,
      directorsByNameRes.error,
      directorsByIdRes.error,
      txByTextRes.error,
      txByIdRes.error,
    ].filter(Boolean) as any[]

    if (errors.length > 0) {
      setErrMsg(errors[0]?.message ?? "Erreur Supabase")
      setResults([])
      setLoading(false)
      return
    }

    const companies = [
      ...(companiesByIdRes.data ?? []),
      ...(companiesByNameRes.data ?? []),
    ]
    const directors = [
      ...(directorsByIdRes.data ?? []),
      ...(directorsByNameRes.data ?? []),
    ]
    const transactions = [
      ...(txByIdRes.data ?? []),
      ...(txByTextRes.data ?? []),
    ]

    // dédup par (type,id)
    const map = new Map<string, ResultItem>()

    for (const c of companies) {
      map.set(`company:${c.id_temp}`, {
        type: "company",
        id: c.id_temp,
        label: c.company_name || c.id_temp,
      })
    }
    for (const d of directors) {
      map.set(`director:${d.id_director}`, {
        type: "director",
        id: d.id_director,
        label: `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || d.id_director,
      })
    }
    for (const t of transactions) {
      map.set(`transaction:${t.id_transaction}`, {
        type: "transaction",
        id: t.id_transaction,
        label: t.type_details || t.id_transaction,
      })
    }

    setResults(Array.from(map.values()).slice(0, 12))
    setLoading(false)
  }

  function goTo(item: ResultItem) {
    if (item.type === "company") router.push(`/companies/${item.id}`)
    if (item.type === "director") router.push(`/directors/${item.id}`)
    if (item.type === "transaction") router.push(`/transactions/${item.id}`)
    setResults([])
    setQuery("")
  }

  return (
    <div className="relative w-[420px] max-w-full">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher rapide (nom ou ID)…"
        className="w-full border rounded-lg px-4 py-2 text-sm bg-white"
      />

      {(loading || errMsg || results.length > 0) && (
        <div className="absolute mt-2 w-full bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Recherche…
            </div>
          )}

          {errMsg && !loading && (
            <div className="px-4 py-3 text-sm text-red-600">
              {errMsg}
              <div className="text-xs text-muted-foreground mt-1">
                (Regarde RLS / droits SELECT si besoin)
              </div>
            </div>
          )}

          {!loading && !errMsg && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat
            </div>
          )}

          {!loading &&
            !errMsg &&
            results.map((item, idx) => (
              <button
                key={`${item.type}:${item.id}:${idx}`}
                onClick={() => goTo(item)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                type="button"
              >
                <span className="font-medium">{item.label}</span>
                <span className="ml-2 text-xs text-gray-400">
                  ({item.type})
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}