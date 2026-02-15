import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import StatusBadge from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function TransactionDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // =========================
  // FETCH TRANSACTION
  // =========================

  const { data: tx } = await supabase
    .from("transactions")
    .select(`
      id_transaction,
      amount,
      status,
      due_date,
      paid_at,
      type_details,
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
    `)
    .eq("id_transaction", id)
    .single()

  if (!tx) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Transaction introuvable</h1>
        <Link href="/transactions" className="text-blue-600 underline">
          Retour aux transactions
        </Link>
      </div>
    )
  }

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Transaction {tx.id_transaction.slice(0, 8)}
        </h1>

        <Link
          href="/transactions"
          className="text-sm text-muted-foreground hover:text-black"
        >
          ← Retour
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-6 text-sm">

          <div>
            <div className="text-muted-foreground">Entreprise</div>
            <div className="font-medium">
              {tx.companies?.company_name ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Directeur</div>
            <div className="font-medium">
              {tx.directors
                ? `${tx.directors.first_name} ${tx.directors.last_name}`
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Statut</div>
            <StatusBadge status={tx.status} />
          </div>

          <div>
            <div className="text-muted-foreground">Montant</div>
            <div className="font-semibold">
              {Number(tx.amount).toLocaleString()} €
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Due Date</div>
            <div>{tx.due_date ?? "—"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Payé le</div>
            <div>{tx.paid_at ?? "Non payé"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Collecteur</div>
            <div>
              {tx.agents
                ? `${tx.agents.first_name} ${tx.agents.last_name}`
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Type</div>
            <div>{tx.type_details ?? "—"}</div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}