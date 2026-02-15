import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function TransactionsPage(props: {
  searchParams: Promise<{
    page?: string
    limit?: string
  }>
}) {
  const searchParams = await props.searchParams

  const page = Number(searchParams?.page ?? 1)
  const limit = Number(searchParams?.limit ?? 25)

  const offset = (page - 1) * limit

  // =========================
  // KPI
  // =========================

  const { data: kpiData } = await supabase
    .from("transactions")
    .select("amount, status")

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
  // TRANSACTIONS (PAGINATED)
  // =========================

  const {
    data: transactions,
    count,
  } = await supabase
    .from("transactions")
    .select(
      `
      id_transaction,
      amount,
      status,
      due_date,
      companies:company_id (
        company_name
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
    .order("due_date", { ascending: false })
    .range(offset, offset + limit - 1)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / limit)

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Transactions</h1>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {totalAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-600">
              {validatedAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-yellow-500">
              {pendingAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-red-600">
              {lateAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="p-4">ID</th>
              <th className="p-4">Entreprise</th>
              <th className="p-4">Directeur</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Collecteur</th>
              <th className="p-4"></th>
            </tr>
          </thead>

          <tbody>
            {transactions?.map((tx: any) => (
              <tr key={tx.id_transaction} className="border-b">
                <td className="p-4">{tx.id_transaction.slice(0, 8)}</td>

                <td className="p-4">
                  {tx.companies?.company_name ?? "—"}
                </td>

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
                  <Link
                    href={`/transactions/${tx.id_transaction}`}
                    className="text-muted-foreground hover:text-black transition"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">

          {/* LIMIT SELECTOR */}
          <div className="flex gap-2 text-sm">
            {[25, 50, 100].map((l) => (
              <Link
                key={l}
                href={`/transactions?page=1&limit=${l}`}
                className={`px-3 py-1 rounded ${
                  l === limit
                    ? "bg-black text-white"
                    : "bg-white border"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          {/* PAGE NAVIGATION */}
          <div className="flex gap-2 text-sm items-center">
            {page > 1 && (
              <Link
                href={`/transactions?page=${page - 1}&limit=${limit}`}
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
                href={`/transactions?page=${page + 1}&limit=${limit}`}
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