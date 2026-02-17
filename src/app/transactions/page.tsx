import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import FilterBar from "@/components/FilterBar"
import FilterToggle from "@/components/FilterToggle"

export const dynamic = "force-dynamic"

export const metadata = { title: "Transactions" }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function TransactionsPage(props: {
  searchParams: Promise<{
    page?: string
    limit?: string
    city?: string
    from?: string
    to?: string
    status?: string
  }>
}) {
  const searchParams = await props.searchParams

  const page = Number(searchParams?.page ?? 1)
  const limit = Number(searchParams?.limit ?? 25)

  const city = searchParams?.city
  const from = searchParams?.from
  const to = searchParams?.to
  const status = searchParams?.status

  const offset = (page - 1) * limit

  // =========================
  // BASE QUERY
  // =========================

  let baseQuery = supabase
    .from("transactions")
    .select(
      `
      id_transaction,
      amount,
      status,
      due_date,
      companies:company_id (
        company_name,
        geo_name
      ),
      directors:director_id (
        first_name,
        last_name
      ),
      agents:collected_by (
        first_name,
        last_name
      )
    `,
      { count: "exact" }
    )

  if (city) baseQuery = baseQuery.eq("companies.geo_name", city)
  if (from) baseQuery = baseQuery.gte("due_date", from)
  if (to) baseQuery = baseQuery.lte("due_date", to)
  if (status) baseQuery = baseQuery.eq("status", status)

  // =========================
  // KPI
  // =========================

  let kpiQuery = supabase
    .from("transactions")
    .select("amount, status, companies ( geo_name )")

  if (city) kpiQuery = kpiQuery.eq("companies.geo_name", city)
  if (from) kpiQuery = kpiQuery.gte("due_date", from)
  if (to) kpiQuery = kpiQuery.lte("due_date", to)
  if (status) kpiQuery = kpiQuery.eq("status", status)

  const { data: kpiData } = await kpiQuery

  let validatedAmount = 0
  let pendingAmount = 0
  let lateAmount = 0

  kpiData?.forEach((tx: any) => {
    if (tx.status === "validated") validatedAmount += Number(tx.amount)
    if (tx.status === "pending") pendingAmount += Number(tx.amount)
    if (tx.status === "late") lateAmount += Number(tx.amount)
  })

  const totalAmount = validatedAmount + pendingAmount + lateAmount

  // =========================
  // DATA
  // =========================

  const { data: transactions, count } = await baseQuery
    .order("due_date", { ascending: false })
    .range(offset, offset + limit - 1)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / limit)

  // =========================
  // CITIES
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

  const buildQuery = (newParams: Record<string, any>) => {
    const params = new URLSearchParams()
    if (city) params.set("city", city)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (status) params.set("status", status)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value))
    })

    return `/transactions?${params.toString()}`
  }

  // =========================
  // RENDER
  // =========================

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* HEADER */}
      <div className="space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi détaillé des paiements
          </p>
        </div>

        {/* Mobile filters */}
        <div className="block xl:hidden">
          <FilterToggle>
            <FilterBar cities={cities} showStatus />
          </FilterToggle>
        </div>

        {/* Desktop filters */}
        <div className="hidden xl:block bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <FilterBar cities={cities} showStatus />
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {totalAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Validées</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {validatedAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>En attente</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-500">
              {pendingAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>En retard</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {lateAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MOBILE CARDS */}
      <div className="xl:hidden space-y-4">
        {transactions?.map((tx: any) => (
          <Card key={tx.id_transaction}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {tx.companies?.company_name ?? "—"}
                </span>
                <StatusBadge status={tx.status} />
              </div>

              <div className="text-sm text-muted-foreground">
                {tx.directors
                  ? `${tx.directors.first_name} ${tx.directors.last_name}`
                  : "—"}
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {Number(tx.amount).toLocaleString()} €
                </span>
                <Link href={`/transactions/${tx.id_transaction}`}>
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="text-xs text-muted-foreground">
                Due: {tx.due_date}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden xl:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="p-4">ID</th>
              <th className="p-4">Entreprise</th>
              <th className="p-4">Directeur</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Due</th>
              <th className="p-4">Collecteur</th>
              <th className="p-4"></th>
            </tr>
          </thead>

          <tbody>
            {transactions?.map((tx: any) => (
              <tr key={tx.id_transaction} className="border-b">
                <td className="p-4">{tx.id_transaction.slice(0, 8)}</td>
                <td className="p-4">{tx.companies?.company_name ?? "—"}</td>
                <td className="p-4">
                  {tx.directors
                    ? `${tx.directors.first_name} ${tx.directors.last_name}`
                    : "—"}
                </td>
                <td className="p-4">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="p-4 font-semibold">
                  {Number(tx.amount).toLocaleString()} €
                </td>
                <td className="p-4">{tx.due_date}</td>
                <td className="p-4">
                  {tx.agents
                    ? `${tx.agents.first_name} ${tx.agents.last_name}`
                    : "—"}
                </td>
                <td className="p-4">
                  <Link href={`/transactions/${tx.id_transaction}`}>
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