// src/app/agents/[id]/page.tsx
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default async function AgentDetail(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    from?: string
    to?: string
    status?: string
  }>
}) {
  const { id } = await props.params
  const sp = await props.searchParams

  const from = sp?.from
  const to = sp?.to
  const status = sp?.status

  // =========================
  // AGENT INFO
  // =========================

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id_agents", id)
    .single()

  if (!agent) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold">Collecteur introuvable</h1>
        <Link
          href="/agents"
          className="text-sm text-muted-foreground hover:text-black"
        >
          ← Retour aux collecteurs
        </Link>
      </div>
    )
  }

  // =========================
  // TRANSACTIONS FILTRÉES
  // =========================

  let txQuery = supabase
    .from("transactions")
    .select(`
      id_transaction,
      amount,
      status,
      created_at,
      due_date,
      type_details,
      companies:company_id (
        id_temp,
        company_name
      ),
      directors:director_id (
        id_director,
        first_name,
        last_name
      )
    `)
    .eq("collected_by", id)

  if (from) txQuery = txQuery.gte("due_date", from)
  if (to) txQuery = txQuery.lte("due_date", to)
  if (status) txQuery = txQuery.eq("status", status)

  const { data: transactions } = await txQuery.order("due_date", {
    ascending: false,
  })

  // =========================
  // KPI CALCUL
  // =========================

  let validated = 0
  let pending = 0
  let late = 0

  transactions?.forEach((tx: any) => {
    if (tx.status === "validated") validated += Number(tx.amount)
    if (tx.status === "pending") pending += Number(tx.amount)
    if (tx.status === "late") late += Number(tx.amount)
  })

  const total = validated + pending + late

  // =========================
  // RENDER
  // =========================

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* BACK */}
      <Link
        href="/agents"
        className="text-sm text-muted-foreground hover:text-black"
      >
        ← Retour aux collecteurs
      </Link>

      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {agent.first_name} {agent.last_name}
        </h1>
        <div className="text-sm text-muted-foreground">
          Organisation : {agent.organization ?? "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          ID : {agent.id_agents}
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total collecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {total.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600 font-semibold">
              {validated.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600 font-semibold">
              {pending.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600 font-semibold">
              {late.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TRANSACTIONS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les transactions</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">Transaction</th>
                  <th className="p-4 text-left">Statut</th>
                  <th className="p-4 text-left">Montant</th>
                  <th className="p-4"></th>
                </tr>
              </thead>

              <tbody>
                {(transactions ?? []).length > 0 ? (
                  (transactions ?? []).map((tx: any) => (
                    <tr key={tx.id_transaction} className="border-b last:border-b-0">
                      <td className="p-4">
                        <div className="font-medium">
                          {tx.type_details ?? "—"} —{" "}
                          {tx.companies?.company_name ?? "—"}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Notifiée le : {tx.created_at?.slice(0, 10)}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Due le : {tx.due_date ?? "—"}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Directeur :{" "}
                          {tx.directors
                            ? `${tx.directors.first_name} ${tx.directors.last_name}`
                            : "—"}
                        </div>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="p-4 font-semibold">
                        {Number(tx.amount).toLocaleString()} €
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/transactions/${tx.id_transaction}`}
                          className="text-muted-foreground hover:text-black transition"
                        >
                          <ArrowRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={4}>
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}