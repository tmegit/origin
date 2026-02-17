import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import FilterBar from "@/components/FilterBar"
import FilterToggle from "@/components/FilterToggle"

export const dynamic = "force-dynamic"

export const metadata = { title: "Agents" }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default async function AgentsPage(props: {
  searchParams: Promise<{
    city?: string
    from?: string
    to?: string
    status?: string
    page?: string
    limit?: string
  }>
}) {
  const sp = await props.searchParams

  const city = sp?.city
  const from = sp?.from
  const to = sp?.to
  const status = sp?.status

  const page = Math.max(1, Number(sp?.page ?? 1))
  const limit = [25, 50, 100].includes(Number(sp?.limit))
    ? Number(sp?.limit)
    : 25

  const offset = (page - 1) * limit

  // =========================
  // FETCH TRANSACTIONS
  // =========================

  let query = supabase
    .from("transactions")
    .select(`
      amount,
      status,
      due_date,
      collected_by,
      companies ( geo_name ),
      agents:collected_by (
        id_agents,
        first_name,
        last_name,
        organization
      )
    `)
    .not("collected_by", "is", null)

  if (from) query = query.gte("due_date", from)
  if (to) query = query.lte("due_date", to)
  if (city) query = query.eq("companies.geo_name", city)
  if (status) query = query.eq("status", status)

  const { data: transactions } = await query

  // =========================
  // AGGREGATION
  // =========================

  const agentMap: Record<
    string,
    {
      name: string
      organization: string
      totalTransactions: number
      validated: number
      pending: number
      late: number
    }
  > = {}

  transactions?.forEach((tx: any) => {
    if (!tx.collected_by || !tx.agents) return

    const id = tx.collected_by
    const name = `${tx.agents.first_name} ${tx.agents.last_name}`

    if (!agentMap[id]) {
      agentMap[id] = {
        name,
        organization: tx.agents.organization ?? "",
        totalTransactions: 0,
        validated: 0,
        pending: 0,
        late: 0,
      }
    }

    agentMap[id].totalTransactions += 1

    if (tx.status === "validated")
      agentMap[id].validated += Number(tx.amount)

    if (tx.status === "pending")
      agentMap[id].pending += Number(tx.amount)

    if (tx.status === "late")
      agentMap[id].late += Number(tx.amount)
  })

  const agents = Object.entries(agentMap)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.validated - a.validated)

  const paginatedAgents = agents.slice(offset, offset + limit)
  const totalPages = Math.max(1, Math.ceil(agents.length / limit))

  // =========================
  // KPI GLOBAL
  // =========================

  const totalValidated = agents.reduce((s, a) => s + a.validated, 0)
  const totalPending = agents.reduce((s, a) => s + a.pending, 0)
  const totalLate = agents.reduce((s, a) => s + a.late, 0)
  const totalAmount = totalValidated + totalPending + totalLate

  // =========================
  // AUTOCOMPLETE CITIES
  // =========================

  const { data: citiesData } = await supabase
    .from("companies")
    .select("geo_name")
    .not("geo_name", "is", null)

  const cities =
    citiesData
      ?.map((c: any) => c.geo_name)
      .filter((v: any, i: number, arr: any[]) => v && arr.indexOf(v) === i)
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
            Collecteurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue consolidée des collecteurs et de leurs performances
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
            <CardTitle>Total collecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {totalAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600 font-semibold">
              {totalValidated.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600 font-semibold">
              {totalPending.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600 font-semibold">
              {totalLate.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">Collecteur</th>
                  <th className="p-4 text-left">Organisation</th>
                  <th className="p-4 text-left">Transactions</th>
                  <th className="p-4 text-left">Validé</th>
                  <th className="p-4 text-left">En attente</th>
                  <th className="p-4 text-left">En retard</th>
                  <th className="p-4"></th>
                </tr>
              </thead>

              <tbody>
                {paginatedAgents.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium">{a.name}</td>
                    <td className="p-4">{a.organization}</td>
                    <td className="p-4">{a.totalTransactions}</td>
                    <td className="p-4 text-green-600 font-medium">
                      {a.validated.toLocaleString()} €
                    </td>
                    <td className="p-4 text-yellow-600 font-medium">
                      {a.pending.toLocaleString()} €
                    </td>
                    <td className="p-4 text-red-600 font-medium">
                      {a.late.toLocaleString()} €
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/agents/${a.id}`}
                        className="text-muted-foreground hover:text-black"
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
          <div className="flex justify-between items-center p-4 border-t bg-gray-50 text-sm">
            <div>
              Page {page} / {totalPages}
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}