import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Map from "@/components/Map"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type LatestTransaction = {
  id_transaction: string
  amount: number
  paid_at: string | null
  type_details: string | null
  companies: { company_name: string }[] | null
  agents: { first_name: string; last_name: string }[] | null
}

export default async function Dashboard() {
  // =========================
  // MAP DATA
  // =========================
  const { data: companies } = await supabase
    .from("companies")
    .select("latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null)

const mapPoints =
  companies
    ?.filter(
      (c) =>
        c.latitude !== null &&
        c.longitude !== null &&
        !isNaN(Number(c.latitude)) &&
        !isNaN(Number(c.longitude))
    )
    .map((c) => ({
      id: `${c.latitude}-${c.longitude}`,
      lat: Number(c.latitude),
      lng: Number(c.longitude),
    })) || []

  // =========================
  // ENTREPRISES
  // =========================
  const { count: totalCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })

  const { count: formalizedCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("company_formal_status", "formalized")

  const total = totalCompanies ?? 0
  const formalized = formalizedCompanies ?? 0

  const formalizationRate =
    total > 0
      ? ((formalized / total) * 100).toFixed(1)
      : "0.0"

  // =========================
  // TRANSACTIONS SUMMARY
  // =========================
  const { data: summary } = await supabase
    .from("transactions_summary")
    .select("*")

  let validatedAmount = 0
  let lateAmount = 0

  summary?.forEach((row) => {
    if (row.status === "validated") {
      validatedAmount = Number(row.total_amount) || 0
    }

    if (row.status === "late") {
      lateAmount = Number(row.total_amount) || 0
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
const {
  data: latestTransactions,
  error: latestError,
} = await supabase
  .from("transactions")
  .select(`
    id_transaction,
    amount,
    paid_at,
    type_details,
    companies (
      company_name
    ),
    agents (
      first_name,
      last_name
    )
  `)
  .eq("status", "validated")
  .order("paid_at", { ascending: false })
  .limit(10)

  if (latestError) {
    console.log("LATEST TX ERROR =", latestError)
  }
  console.log("LATEST TX RAW =", JSON.stringify(latestTransactions?.[0], null, 2))

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>

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

      {/* MAP + LATEST TRANSACTIONS */}
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
    </div>
  )
}