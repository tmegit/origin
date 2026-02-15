import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Map from "@/components/Map"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    companies?.map(c => ({
      latitude: c.latitude,
      longitude: c.longitude
    })) || []

  // =========================
  // TOTAL ENTREPRISES
  // =========================
  const { count: totalCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })

  // =========================
  // ENTREPRISES FORMALISÉES
  // =========================
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
let totalTransactionsAmount = validatedAmount + lateAmount

const lateRate =
  totalTransactionsAmount > 0
    ? ((lateAmount / totalTransactionsAmount) * 100).toFixed(1)
    : "0.0"

const validatedRate =
  totalTransactionsAmount > 0
    ? ((validatedAmount / totalTransactionsAmount) * 100).toFixed(1)
    : "0.0"


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

{/* CARTE */}
<div className="grid grid-cols-4 gap-6">
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle>Cartographie des entreprises</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="w-full relative" style={{ aspectRatio: "2 / 1" }}>
        <Map points={mapPoints} />
      </div>
    </CardContent>
  </Card>
</div>

    </div>
  )
}
