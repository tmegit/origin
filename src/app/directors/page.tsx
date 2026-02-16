import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import FilterBar from "@/components/FilterBar"
import FilterToggle from "@/components/FilterToggle"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function DirectorsPage(props: {
  searchParams: Promise<{
    city?: string
    from?: string
    to?: string
    status?: string
  }>
}) {
  const searchParams = await props.searchParams

  const city = searchParams?.city
  const from = searchParams?.from
  const to = searchParams?.to
  const status = searchParams?.status

  // =========================
  // FETCH TRANSACTIONS
  // =========================

  let query = supabase
    .from("transactions")
    .select(`
      amount,
      status,
      due_date,
      director_id,
      directors:director_id (
        id_director,
        first_name,
        last_name
      ),
      companies:company_id (
        company_name,
        geo_name
      )
    `)
    .not("director_id", "is", null)

  if (from) query = query.gte("due_date", from)
  if (to) query = query.lte("due_date", to)
  if (city) query = query.eq("companies.geo_name", city)
  if (status && status !== "") query = query.eq("status", status)

  const { data: transactions } = await query

  // =========================
  // AGGREGATION
  // =========================

  const directorMap: Record<
    string,
    {
      name: string
      companies: Set<string>
      totalTransactions: number
      lateAmount: number
      pendingAmount: number
      validatedAmount: number
    }
  > = {}

  transactions?.forEach((tx: any) => {
    if (!tx.director_id || !tx.directors) return

    const id = tx.director_id
    const name = `${tx.directors.first_name} ${tx.directors.last_name}`

    if (!directorMap[id]) {
      directorMap[id] = {
        name,
        companies: new Set(),
        totalTransactions: 0,
        lateAmount: 0,
        pendingAmount: 0,
        validatedAmount: 0,
      }
    }

    directorMap[id].totalTransactions += 1

    if (tx.status === "late") {
      directorMap[id].lateAmount += Number(tx.amount)
    }
    if (tx.status === "pending") {
      directorMap[id].pendingAmount += Number(tx.amount)
    }
    if (tx.status === "validated") {
      directorMap[id].validatedAmount += Number(tx.amount)
    }

    if (tx.companies?.company_name) {
      directorMap[id].companies.add(tx.companies.company_name)
    }
  })

  const directors = Object.entries(directorMap)
    .map(([id, data]) => ({
      id,
      ...data,
      companies: Array.from(data.companies),
    }))
    .sort((a, b) => b.lateAmount - a.lateAmount)

  // =========================
  // KPI
  // =========================

  const totalDirectors = directors.length
  const totalLateAmount = directors.reduce((s, d) => s + d.lateAmount, 0)
  const totalPendingAmount = directors.reduce((s, d) => s + d.pendingAmount, 0)
  const totalValidatedAmount = directors.reduce((s, d) => s + d.validatedAmount, 0)

  // =========================
  // AUTOCOMPLETE VILLES
  // =========================

  const { data: citiesData } = await supabase
    .from("companies")
    .select("geo_name")
    .not("geo_name", "is", null)

  const cities =
    citiesData
      ?.map((c) => c.geo_name)
      .filter((v, i, arr) => v && arr.indexOf(v) === i)
      .sort() ?? []

  // =========================
  // RENDER
  // =========================

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* HEADER */}
      <div className="space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Directeurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue consolidée des responsables et de leur exposition
          </p>
        </div>

        {/* Mobile filter */}
        <div className="block xl:hidden">
          <FilterToggle>
            <FilterBar cities={cities} showStatus />
          </FilterToggle>
        </div>

        {/* Desktop filter */}
        <div className="hidden xl:block bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <FilterBar cities={cities} showStatus />
        </div>

      </div>

      {/* KPI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

        <Card>
          <CardHeader>
            <CardTitle>Total directeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {totalDirectors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {totalLateAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-500">
              {totalPendingAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {totalValidatedAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="p-4">Directeur</th>
                  <th className="p-4">Entreprises</th>
                  <th className="p-4">Transactions</th>
                  <th className="p-4">En retard</th>
                  <th className="p-4">En attente</th>
                  <th className="p-4">Validé</th>
                  <th className="p-4"></th>
                </tr>
              </thead>

              <tbody>
                {directors.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">
                      {d.name}
                    </td>

                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {d.companies.join(", ")}
                    </td>

                    <td className="p-4">
                      {d.totalTransactions}
                    </td>

                    <td className="p-4 text-red-600 font-semibold">
                      {d.lateAmount.toLocaleString()} €
                    </td>

                    <td className="p-4 text-yellow-600 font-semibold">
                      {d.pendingAmount.toLocaleString()} €
                    </td>

                    <td className="p-4 text-green-600 font-semibold">
                      {d.validatedAmount.toLocaleString()} €
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/directors/${d.id}`}
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
        </CardContent>
      </Card>

    </div>
  )
}