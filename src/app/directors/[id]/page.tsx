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

export default async function DirectorDetail(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    from?: string
    to?: string
    status?: string
  }>
}) {
  const { id } = await props.params
  const searchParams = await props.searchParams

  const from = searchParams?.from
  const to = searchParams?.to
  const status = searchParams?.status

  // =========================
  // DIRECTOR INFO
  // =========================

  const { data: director } = await supabase
    .from("directors")
    .select("*")
    .eq("id_director", id)
    .single()

  if (!director) {
    return <div className="p-8">Directeur introuvable</div>
  }

  // =========================
  // ENTREPRISES DIRIGÉES
  // =========================

  const { data: companyIdsRows } = await supabase
    .from("transactions")
    .select("company_id")
    .eq("director_id", id)

  const uniqueCompanyIds = [
    ...new Set(companyIdsRows?.map((r: any) => r.company_id)),
  ]

  let companies: any[] = []

  if (uniqueCompanyIds.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select(`
        id_temp,
        company_name,
        geo_name,
        geocode_label,
        company_formal_status,
        company_status
      `)
      .in("id_temp", uniqueCompanyIds)

    companies = data ?? []
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
      )
    `)
    .eq("director_id", id)

  if (from) txQuery = txQuery.gte("due_date", from)
  if (to) txQuery = txQuery.lte("due_date", to)
  if (status) txQuery = txQuery.eq("status", status)

  const { data: transactions } = await txQuery.order("due_date", {
    ascending: false,
  })

  // =========================
  // KPI
  // =========================

  let lateAmount = 0
  let pendingAmount = 0
  let validatedAmount = 0

  transactions?.forEach((tx: any) => {
    if (tx.status === "late") lateAmount += Number(tx.amount)
    if (tx.status === "pending") pendingAmount += Number(tx.amount)
    if (tx.status === "validated") validatedAmount += Number(tx.amount)
  })

  const totalAmount = lateAmount + pendingAmount + validatedAmount

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-8 space-y-8">

      {/* RETOUR */}
      <Link
        href="/directors"
        className="text-sm text-muted-foreground hover:text-black"
      >
        ← Retour aux directeurs
      </Link>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          {director.first_name} {director.last_name}
        </h1>
        <div className="text-sm text-muted-foreground">
          ID: {director.id_director}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardTitle>Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {totalAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>En retard</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl text-red-600 font-semibold">
              {lateAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>En attente</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl text-yellow-500 font-semibold">
              {pendingAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Validé</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl text-green-600 font-semibold">
              {validatedAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ENTREPRISES */}
      <Card>
        <CardHeader>
          <CardTitle>Entreprises dirigées</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Entreprise</th>
                <th className="p-4 text-left">Formalisation</th>
                <th className="p-4 text-left">Activité</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {companies.map((company: any) => {
                const isOpen =
                  company.company_status &&
                  company.company_status.toLowerCase() === "open"

                return (
                  <tr key={company.id_temp} className="border-b">
                    <td className="p-4">
                      <div className="font-medium">
                        {company.company_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {company.id_temp}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {company.geocode_label ?? company.geo_name}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          company.company_formal_status === "formalized"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {company.company_formal_status === "formalized"
                          ? "Formalisée"
                          : "Détectée"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isOpen
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isOpen ? "Ouverte" : "Fermée"}
                      </span>
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/companies/${company.id_temp}`}
                        className="text-muted-foreground hover:text-black"
                      >
                        <ArrowRight size={18} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les transactions</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Transaction</th>
                <th className="p-4 text-left">Statut</th>
                <th className="p-4 text-left">Montant</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {transactions?.map((tx: any) => (
                <tr key={tx.id_transaction} className="border-b">
                  <td className="p-4">
                    <div className="font-medium">
                      {tx.type_details} — {tx.companies?.company_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notifiée le : {tx.created_at?.slice(0, 10)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Due le : {tx.due_date}
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
                      className="text-muted-foreground hover:text-black"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  )
}