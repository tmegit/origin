import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import FilterBar from "@/components/FilterBar"

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
  // FETCH TRANSACTIONS (FILTERED)
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

  const totalLateAmount = directors.reduce(
    (sum, d) => sum + d.lateAmount,
    0
  )

  const totalPendingAmount = directors.reduce(
    (sum, d) => sum + d.pendingAmount,
    0
  )

  const totalValidatedAmount = directors.reduce(
    (sum, d) => sum + d.validatedAmount,
    0
  )

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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">Directeurs</h1>
        <FilterBar cities={cities} showStatus />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total directeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {totalDirectors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-red-600">
              {totalLateAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-yellow-500">
              {totalPendingAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-600">
              {totalValidatedAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
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
              <tr key={d.id} className="border-b">
                <td className="p-4 font-medium">{d.name}</td>
                <td className="p-4 text-muted-foreground">
                  {d.companies.join(", ")}
                </td>
                <td className="p-4">{d.totalTransactions}</td>
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
    </div>
  )
}