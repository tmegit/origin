import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Map from "@/components/Map"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import FilterBar from "@/components/FilterBar"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Dashboard(props: {
  searchParams: Promise<{
    city?: string
    from?: string
    to?: string
  }>
}) {
  const searchParams = await props.searchParams
  const city = searchParams?.city
  const from = searchParams?.from
  const to = searchParams?.to

  // =========================
  // MAP DATA
  // =========================

let companiesQuery = supabase
  .from("companies")
  .select("latitude, longitude, geo_name")
  .not("latitude", "is", null)
  .not("longitude", "is", null)

if (city) {
  companiesQuery = companiesQuery.eq("geo_name", city)
}

const { data: companies } = await companiesQuery

  const mapPoints =
    companies
      ?.filter(
        (c) =>
          c.latitude !== null &&
          c.longitude !== null &&
          !isNaN(Number(c.latitude)) &&
          !isNaN(Number(c.longitude))
      )
      .map((c, index) => ({
        id: `${c.latitude}-${c.longitude}-${index}`,
        lat: Number(c.latitude),
        lng: Number(c.longitude),
      })) || []

// =========================
// KPI ENTREPRISES
// =========================

let totalCompaniesQuery = supabase
  .from("companies")
  .select("*", { count: "exact", head: true })

if (city) {
  totalCompaniesQuery = totalCompaniesQuery.eq("geo_name", city)
}

const { count: totalCompanies } = await totalCompaniesQuery

let formalizedQuery = supabase
  .from("companies")
  .select("*", { count: "exact", head: true })
  .eq("company_formal_status", "formalized")

if (city) {
  formalizedQuery = formalizedQuery.eq("geo_name", city)
}

const { count: formalizedCompanies } = await formalizedQuery

const total = totalCompanies ?? 0
const formalized = formalizedCompanies ?? 0

const formalizationRate =
  total > 0 ? ((formalized / total) * 100).toFixed(1) : "0.0"

  // =========================
  // KPI TRANSACTIONS
  // =========================

let kpiTxQuery = supabase
  .from("transactions")
  .select(`
    amount,
    status,
    due_date,
    companies ( geo_name )
  `)

if (from) kpiTxQuery = kpiTxQuery.gte("due_date", from)
if (to) kpiTxQuery = kpiTxQuery.lte("due_date", to)
if (city) kpiTxQuery = kpiTxQuery.eq("companies.geo_name", city)

const { data: kpiTransactions } = await kpiTxQuery

let validatedAmount = 0
let lateAmount = 0

kpiTransactions?.forEach((tx: any) => {
  if (tx.status === "validated") {
    validatedAmount += Number(tx.amount)
  }
  if (tx.status === "late") {
    lateAmount += Number(tx.amount)
  }
})

  const totalTransactionsAmount = validatedAmount + lateAmount

  const lateRate =
    totalTransactionsAmount > 0
      ? ((lateAmount / totalTransactionsAmount) * 100).toFixed(1)
      : "0.0"

  const validatedRate =
    totalTransactionsAmount > 0
      ? ((validatedAmount / totalTransactionsAmount) * 100).toFixed(1)
      : "0.0"

  // =========================
  // DERNIÈRES TRANSACTIONS
  // =========================

  let latestQuery = supabase
    .from("transactions")
    .select(`
      id_transaction,
      amount,
      paid_at,
      due_date,
      type_details,
      companies (
        company_name,
        geo_name
      ),
      agents (
        first_name,
        last_name
      )
    `)
    .eq("status", "validated")

  if (from) latestQuery = latestQuery.gte("due_date", from)
  if (to) latestQuery = latestQuery.lte("due_date", to)
  if (city) latestQuery = latestQuery.eq("companies.geo_name", city)

  const { data: latestTransactions } = await latestQuery
    .order("paid_at", { ascending: false })
    .limit(10)

  // =========================
  // TOP DEBITEURS
  // =========================

  let lateQuery = supabase
    .from("transactions")
    .select(`
      amount,
      due_date,
      director_id,
      companies:company_id (
        company_name,
        geo_name
      ),
      directors:director_id (
        first_name,
        last_name
      )
    `)
    .eq("status", "late")
    .not("director_id", "is", null)

  if (from) lateQuery = lateQuery.gte("due_date", from)
  if (to) lateQuery = lateQuery.lte("due_date", to)
  if (city) lateQuery = lateQuery.eq("companies.geo_name", city)

  const { data: lateTransactions } = await lateQuery

  const debtorMap: Record<
    string,
    {
      directorName: string
      total: number
      companies: Set<string>
      oldestDueDate: string | null
    }
  > = {}

  lateTransactions?.forEach((tx: any) => {
    if (!tx.director_id || !tx.directors) return

    const directorName = `${tx.directors.first_name} ${tx.directors.last_name}`

    if (!debtorMap[tx.director_id]) {
      debtorMap[tx.director_id] = {
        directorName,
        total: 0,
        companies: new Set(),
        oldestDueDate: tx.due_date,
      }
    }

    debtorMap[tx.director_id].total += Number(tx.amount)

    if (tx.companies?.company_name)
      debtorMap[tx.director_id].companies.add(tx.companies.company_name)

    if (
      tx.due_date &&
      (!debtorMap[tx.director_id].oldestDueDate ||
        tx.due_date < debtorMap[tx.director_id].oldestDueDate)
    ) {
      debtorMap[tx.director_id].oldestDueDate = tx.due_date
    }
  })

  const sortedDebtors = Object.entries(debtorMap)
    .map(([id, data]) => ({
      id,
      ...data,
      companies: Array.from(data.companies),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // =========================
  // TOP COLLECTEURS
  // =========================

  let collectorQuery = supabase
    .from("transactions")
    .select(`
      amount,
      due_date,
      companies ( geo_name ),
      agents (
        id_agents,
        first_name,
        last_name,
        organization
      )
    `)
    .eq("status", "validated")

  if (from) collectorQuery = collectorQuery.gte("due_date", from)
  if (to) collectorQuery = collectorQuery.lte("due_date", to)
  if (city) collectorQuery = collectorQuery.eq("companies.geo_name", city)

  const { data: collectedTx } = await collectorQuery

  const collectorMap: Record<
    string,
    {
      name: string
      organization: string
      total: number
      count: number
    }
  > = {}

  collectedTx?.forEach((tx: any) => {
    if (!tx.agents) return

    const id = tx.agents.id_agents

    if (!collectorMap[id]) {
      collectorMap[id] = {
        name: `${tx.agents.first_name} ${tx.agents.last_name}`,
        organization: tx.agents.organization ?? "",
        total: 0,
        count: 0,
      }
    }

    collectorMap[id].total += Number(tx.amount)
    collectorMap[id].count += 1
  })

  const topCollectors = Object.entries(collectorMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <FilterBar />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total entreprises détectées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entreprises formalisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formalized.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                ({formalizationRate}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paiements en retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-red-600">
                {lateAmount.toLocaleString()} €
              </span>
              <span className="text-sm text-muted-foreground">
                ({lateRate}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paiements collectés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-green-600">
                {validatedAmount.toLocaleString()} €
              </span>
              <span className="text-sm text-muted-foreground">
                ({validatedRate}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAP + LATEST */}
      <div className="grid grid-cols-4 gap-6">

        <Card className="col-span-2 h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Cartographie des entreprises</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <Map points={mapPoints} />
          </CardContent>
        </Card>

        <Card className="col-span-2 h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Dernières transactions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 pr-4">
            {latestTransactions?.map((tx: any) => (
              <div
                key={tx.id_transaction}
                className="flex justify-between items-start border-b pb-3"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {tx.companies?.company_name} ({tx.type_details})
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {tx.id_transaction}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {tx.agents
                      ? `${tx.agents.first_name} ${tx.agents.last_name}`
                      : "—"}{" "}
                    ({tx.paid_at})
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-green-600 font-semibold">
                    {Number(tx.amount).toLocaleString()} €
                  </div>

                  <Link
                    href={`/transactions/${tx.id_transaction}`}
                    className="text-muted-foreground hover:text-black transition"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* DEBITEURS + COLLECTEURS */}
      <div className="grid grid-cols-4 gap-6">

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Top débiteurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedDebtors.map((debtor) => (
              <div
                key={debtor.id}
                className="flex justify-between items-start border-b pb-3"
              >
                <div className="space-y-1">
                  <div className="font-semibold">
                    {debtor.directorName}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {debtor.companies.join(", ")}
                  </div>

                  <div className="text-xs text-red-600">
                    En retard depuis le : {debtor.oldestDueDate}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-red-600 font-semibold">
                    {debtor.total.toLocaleString()} €
                  </div>

                  <Link
                    href={`/directors/${debtor.id}`}
                    className="text-muted-foreground hover:text-black transition"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Top collecteurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCollectors.map((collector) => (
              <div
                key={collector.id}
                className="flex justify-between items-start border-b pb-3"
              >
                <div className="space-y-1">
                  <div className="font-semibold">
                    {collector.name}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {collector.organization}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {collector.count} transactions
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-green-600 font-semibold">
                    {collector.total.toLocaleString()} €
                  </div>

                  <Link
                    href={`/agents/${collector.id}`}
                    className="text-muted-foreground hover:text-black transition"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}