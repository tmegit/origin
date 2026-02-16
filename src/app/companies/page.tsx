import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import CompaniesFilterBar from "@/components/CompaniesFilterBar"
import CreateCompanyForm from "@/components/CreateCompanyForm"
import {
  ActivityStatusBadge,
  FormalStatusBadge,
} from "@/components/CompanyBadges"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function applyFilters(q: any, city?: string, formal?: string, activity?: string) {
  if (city) q = q.eq("geo_name", city)
  if (formal === "formalized") q = q.eq("company_formal_status", "formalized")
  if (formal === "detected") q = q.neq("company_formal_status", "formalized")
  if (activity === "open") q = q.eq("company_status", "open")
  if (activity === "closed") q = q.eq("company_status", "closed")
  return q
}

export default async function CompaniesPage(props: {
  searchParams: Promise<{
    city?: string
    formal?: string
    activity?: string
    page?: string
    limit?: string
  }>
}) {
  const sp = await props.searchParams

  const city = sp?.city
  const formal = sp?.formal
  const activity = sp?.activity

  const page = Math.max(1, Number(sp?.page ?? 1))
  const limit = [25, 50, 100].includes(Number(sp?.limit))
    ? Number(sp?.limit)
    : 25
  const offset = (page - 1) * limit

  // AUTOCOMPLETE VILLES
  const { data: citiesData } = await supabase
    .from("companies")
    .select("geo_name")
    .not("geo_name", "is", null)

  const cities =
    citiesData
      ?.map((c: any) => c.geo_name)
      .filter((v: any, i: number, arr: any[]) => v && arr.indexOf(v) === i)
      .sort() ?? []

  // KPI
  let totalQ = supabase.from("companies").select("*", { count: "exact", head: true })
  totalQ = applyFilters(totalQ, city, formal, activity)
  const { count: totalCompanies } = await totalQ

  const { count: formalizedCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("company_formal_status", "formalized")

  const { count: detectedCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .neq("company_formal_status", "formalized")

  const { count: closedCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("company_status", "closed")

  // LISTE PAGINÉE
  let listQ = supabase
    .from("companies")
    .select(
      `
      id_temp,
      company_name,
      geo_name,
      geocode_label,
      company_formal_status,
      company_status,
      naf_code,
      naf_label,
      director_id,
      directors:director_id (
        id_director,
        first_name,
        last_name
      )
    `,
      { count: "exact" }
    )

  listQ = applyFilters(listQ, city, formal, activity)

  const { data: companies, count } = await listQ
    .order("company_name", { ascending: true })
    .range(offset, offset + limit - 1)

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  const ids = (companies ?? []).map((c: any) => c.id_temp)

  const directorMap: Record<string, any> = {}
  if (ids.length > 0) {
    const { data: txRows } = await supabase
      .from("transactions")
      .select(`
        company_id,
        directors:director_id (
          id_director,
          first_name,
          last_name
        )
      `)
      .in("company_id", ids)
      .not("director_id", "is", null)

    txRows?.forEach((row: any) => {
      if (row.company_id && row.directors && !directorMap[row.company_id]) {
        directorMap[row.company_id] = row.directors
      }
    })
  }

  const txCountMap: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: txCountRows } = await supabase
      .from("transactions")
      .select("company_id")
      .in("company_id", ids)

    txCountRows?.forEach((r: any) => {
      txCountMap[r.company_id] = (txCountMap[r.company_id] ?? 0) + 1
    })
  }

  const qsBase = new URLSearchParams()
  if (city) qsBase.set("city", city)
  if (formal) qsBase.set("formal", formal)
  if (activity) qsBase.set("activity", activity)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* HEADER */}
      <div className="space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Entreprises
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre des entités détectées
          </p>
        </div>

              {/* FORM CREATION */}
                <CreateCompanyForm />

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <CompaniesFilterBar cities={cities} />
        </div>

      </div>

      {/* KPI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {(totalCompanies ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Formalisées</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {(formalizedCompanies ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Détectées</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">
              {(detectedCompanies ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fermées</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {(closedCompanies ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Entreprise</th>
                <th className="p-4 text-left">Ville</th>
                <th className="p-4 text-left">Formalisation</th>
                <th className="p-4 text-left">Activité</th>
                <th className="p-4 text-left">Directeur</th>
                <th className="p-4 text-left">Transactions</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {(companies ?? []).map((c: any) => (
                <tr key={c.id_temp} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">
                      {c.company_name ?? "[ND]"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.id_temp}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.geocode_label ?? "—"}
                    </div>
                  </td>

                  <td className="p-4">{c.geo_name ?? "—"}</td>

                  <td className="p-4">
                    <FormalStatusBadge value={c.company_formal_status} />
                  </td>

                  <td className="p-4">
                    <ActivityStatusBadge value={c.company_status} />
                  </td>

                  <td className="p-4">
                    {c.directors
                      ? `${c.directors.first_name} ${c.directors.last_name}`
                      : directorMap[c.id_temp]
                      ? `${directorMap[c.id_temp].first_name} ${directorMap[c.id_temp].last_name}`
                      : "—"}
                  </td>

                  <td className="p-4">
                    {(txCountMap[c.id_temp] ?? 0).toLocaleString()}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/companies/${c.id_temp}`}
                      className="text-muted-foreground hover:text-black transition"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border-t bg-gray-50 text-sm">

          <div className="flex gap-2">
            {[25, 50, 100].map((l) => {
              const p = new URLSearchParams(qsBase)
              p.set("page", "1")
              p.set("limit", String(l))
              return (
                <Link
                  key={l}
                  href={`/companies?${p.toString()}`}
                  className={`px-3 py-1 rounded ${
                    l === limit
                      ? "bg-black text-white"
                      : "bg-white border"
                  }`}
                >
                  {l}
                </Link>
              )
            })}
          </div>

          <div className="flex gap-2 items-center">
            {page > 1 && (
              <Link
                href={`/companies?${qsBase.toString()}&page=${page - 1}&limit=${limit}`}
                className="px-3 py-1 bg-white border rounded"
              >
                Précédent
              </Link>
            )}

            <span>
              Page {page} / {totalPages}
            </span>

            {page < totalPages && (
              <Link
                href={`/companies?${qsBase.toString()}&page=${page + 1}&limit=${limit}`}
                className="px-3 py-1 bg-white border rounded"
              >
                Suivant
              </Link>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}