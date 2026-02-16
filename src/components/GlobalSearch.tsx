"use client"

import { useEffect, useMemo, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

type ResultItem =
  | { type: "company"; id: string; label: string }
  | { type: "director"; id: string; label: string }
  | { type: "transaction"; id: string; label: string }

function isUuid(v: string) {
  return /^[0-9a-f-]{36}$/i.test(v.trim())
}

function splitTerms(q: string) {
  return q
    .trim()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
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

  useEffect(() => {
    const q = query.trim()

    if (q.length < 2) {
      setResults([])
      setErrMsg(null)
      return
    }

    const timeout = setTimeout(() => {
      void runSearch(q)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  async function runSearch(q: string) {
    try {
      setLoading(true)
      setErrMsg(null)

      const qIsUuid = isUuid(q)
      const terms = splitTerms(q)

      // =========================
      // ENTREPRISES
      // =========================
      const companiesQuery = supabase
        .from("companies")
        .select("id_temp, company_name")
        .limit(5)

      const companiesRes = qIsUuid
        ? await companiesQuery.eq("id_temp", q)
        : await companiesQuery.ilike("company_name", `%${q}%`)

      // =========================
      // DIRECTEURS (IMPORTANT: multi-termes)
      // =========================
      const directorsQuery = supabase
        .from("directors")
        .select("id_director, first_name, last_name")
        .limit(5)

      let directorsRes:
        | { data: any[] | null; error: any | null }
        | undefined

      if (qIsUuid) {
        directorsRes = await directorsQuery.eq("id_director", q)
      } else if (terms.length >= 2) {
        const t1 = terms[0]
        const t2 = terms.slice(1).join(" ") // support noms composés

        // or(
        //   and(first_name ilike t1, last_name ilike t2),
        //   and(first_name ilike t2, last_name ilike t1),
        //   first_name ilike q,
        //   last_name ilike q
        // )
        directorsRes = await directorsQuery.or(
          [
            `and(first_name.ilike.%${t1}%,last_name.ilike.%${t2}%)`,
            `and(first_name.ilike.%${t2}%,last_name.ilike.%${t1}%)`,
            `first_name.ilike.%${q}%`,
            `last_name.ilike.%${q}%`,
          ].join(",")
        )
      } else {
        // 1 seul terme : prénom OU nom
        directorsRes = await directorsQuery.or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%`
        )
      }

      // =========================
      // TRANSACTIONS
      // =========================
      const transactionsQuery = supabase
        .from("transactions")
        .select("id_transaction, type_details")
        .limit(5)

      const transactionsRes = qIsUuid
        ? await transactionsQuery.eq("id_transaction", q)
        : await transactionsQuery.ilike("type_details", `%${q}%`)

      if (companiesRes.error) throw companiesRes.error
      if (directorsRes?.error) throw directorsRes.error
      if (transactionsRes.error) throw transactionsRes.error

      const map = new Map<string, ResultItem>()

      for (const c of companiesRes.data ?? []) {
        map.set(`company:${c.id_temp}`, {
          type: "company",
          id: c.id_temp,
          label: c.company_name || c.id_temp,
        })
      }

      for (const d of directorsRes?.data ?? []) {
        map.set(`director:${d.id_director}`, {
          type: "director",
          id: d.id_director,
          label:
            `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() ||
            d.id_director,
        })
      }

      for (const t of transactionsRes.data ?? []) {
        map.set(`transaction:${t.id_transaction}`, {
          type: "transaction",
          id: t.id_transaction,
          label: t.type_details || t.id_transaction,
        })
      }

      setResults(Array.from(map.values()).slice(0, 12))
    } catch (err: any) {
      console.error("Search error:", err)
      setErrMsg(err?.message ? String(err.message) : "Erreur lors de la recherche")
      setResults([])
    } finally {
      setLoading(false)
    }
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
        placeholder="Rechercher (nom ou ID)…"
        className="w-full border rounded-lg px-4 py-2 text-sm bg-white"
      />

      {(loading || errMsg || results.length > 0) && (
        <div className="absolute mt-2 w-full bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Recherche…</div>
          )}

          {errMsg && !loading && (
            <div className="px-4 py-3 text-sm text-red-600">{errMsg}</div>
          )}

          {!loading && !errMsg && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500">Aucun résultat</div>
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
                <span className="ml-2 text-xs text-gray-400">({item.type})</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}