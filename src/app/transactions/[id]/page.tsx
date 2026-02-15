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
      created_at,
      type_details,
      companies:company_id (
        id_temp,
        company_name,
        geo_name
      ),
      directors:director_id (
        id_director,
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
        <Link
          href="/transactions"
          className="text-blue-600 underline"
        >
          Retour aux transactions
        </Link>
      </div>
    )
  }

  // =========================
  // NORMALISATION RELATIONS
  // =========================

  const company = Array.isArray(tx.companies)
    ? tx.companies[0]
    : tx.companies

  const director = Array.isArray(tx.directors)
    ? tx.directors[0]
    : tx.directors

  const agent = Array.isArray(tx.agents)
    ? tx.agents[0]
    : tx.agents

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-8 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link
          href="/transactions"
          className="text-sm text-muted-foreground hover:text-black"
        >
          ← Retour aux transactions
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          Transaction {tx.id_transaction.slice(0, 8)}
        </h1>
        <div className="text-sm text-muted-foreground">
          ID complet : {tx.id_transaction}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* ================= MAIN DETAILS ================= */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Détails de la transaction</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-sm">

            <div className="flex justify-between items-center">
              <div>
                <div className="text-muted-foreground">Statut</div>
                <StatusBadge status={tx.status} />
              </div>

              <div className="text-right">
                <div className="text-muted-foreground">Montant</div>
                <div className="text-2xl font-bold">
                  {Number(tx.amount).toLocaleString()} €
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">

              <div>
                <div className="text-muted-foreground">
                  Type de transaction
                </div>
                <div className="font-medium">
                  {tx.type_details ?? "—"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Notifiée le
                </div>
                <div>
                  {tx.created_at?.slice(0, 10)}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Due le
                </div>
                <div>
                  {tx.due_date ?? "—"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Payé le
                </div>
                <div>
                  {tx.paid_at ?? "Non payé"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  Collecteur
                </div>
                <div>
                  {agent
                    ? `${agent.first_name} ${agent.last_name}`
                    : "—"}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ================= ENTREPRISE ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Entreprise liée</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">

            {company ? (
              <>
                <div className="font-medium">
                  {company.company_name}
                </div>

                <div className="text-muted-foreground text-xs">
                  {company.geo_name}
                </div>

                <Link
                  href={`/companies/${company.id_temp}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Voir la fiche entreprise →
                </Link>
              </>
            ) : (
              <div>—</div>
            )}

          </CardContent>
        </Card>

        {/* ================= DIRECTEUR ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Directeur lié</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">

            {director ? (
              <>
                <div className="font-medium">
                  {director.first_name} {director.last_name}
                </div>

                <Link
                  href={`/directors/${director.id_director}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Voir la fiche directeur →
                </Link>
              </>
            ) : (
              <div>—</div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}