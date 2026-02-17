import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Dirigeant" }
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import UpdateDirectorForm from "@/components/UpdateDirectorForm"

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
  const sp = await props.searchParams

  const from = sp?.from
  const to = sp?.to
  const status = sp?.status

  // =========================
  // DIRECTOR INFO
  // =========================
  const { data: director } = await supabase
    .from("directors")
    .select(`
      id_director,
      first_name,
      last_name,
      gender,
      birth_date,
      nationality,
      phone,
      email,
      postal_address,
      created_at,
      updated_at
    `)
    .eq("id_director", id)
    .single()

  if (!director) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        Directeur introuvable
      </div>
    )
  }

  // =========================
  // ENTREPRISES DIRIGÉES
  // =========================
  const { data: directorCompaniesRows } = await supabase
    .from("director_companies")
    .select("company_id")
    .eq("director_id", id)

  const companyIds = Array.from(
    new Set(
      (directorCompaniesRows ?? [])
        .map((r: any) => r.company_id)
        .filter(Boolean)
    )
  )

  let companies: any[] = []

  if (companyIds.length > 0) {
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
      .in("id_temp", companyIds)
      .order("company_name", { ascending: true })

    companies = data ?? []
  }

  // =========================
  // TRANSACTIONS
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

  ;(transactions ?? []).forEach((tx: any) => {
    const amt = Number(tx.amount) || 0
    if (tx.status === "late") lateAmount += amt
    if (tx.status === "pending") pendingAmount += amt
    if (tx.status === "validated") validatedAmount += amt
  })

  const totalAmount = lateAmount + pendingAmount + validatedAmount

  // =========================
  // RENDER
  // =========================
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* RETOUR */}
      <Link
        href="/directors"
        className="text-sm text-muted-foreground hover:text-black"
      >
        ← Retour aux directeurs
      </Link>

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {director.first_name} {director.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          ID : {director.id_director}
        </p>
      </div>

      {/* INFOS DIRECTEUR */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Informations</CardTitle>
          <UpdateDirectorForm director={director} />
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-muted-foreground">Genre</div>
            <div>{director.gender ?? "—"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Date de naissance</div>
            <div>{director.birth_date ?? "—"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Nationalité</div>
            <div>{director.nationality ?? "—"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Téléphone</div>
            <div>{director.phone ?? "—"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Email</div>
            <div>{director.email ?? "—"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Adresse</div>
            <div>{director.postal_address ?? "—"}</div>
          </div>
        </CardContent>
      </Card>

      {/* KPI */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {totalAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600 font-semibold">
              {lateAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-500 font-semibold">
              {pendingAmount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600 font-semibold">
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">Entreprise</th>
                  <th className="p-4 text-left">Formalisation</th>
                  <th className="p-4 text-left">Activité</th>
                  <th className="p-4"></th>
                </tr>
              </thead>

              <tbody>
                {companies.length > 0 ? (
                  companies.map((company: any) => {
                    const status = (company.company_status ?? "").toLowerCase()
                    const isOpen = status === "open"

                    return (
                      <tr key={company.id_temp} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">
                            {company.company_name ?? "[ND]"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {company.id_temp}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {company.geocode_label ?? company.geo_name ?? "—"}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            company.company_formal_status === "formalized"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {company.company_formal_status === "formalized"
                              ? "Formalisée"
                              : "Détectée"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isOpen
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
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
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-muted-foreground">
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les transactions</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
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
                    <tr key={tx.id_transaction} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">
                          {tx.type_details ?? "—"} — {tx.companies?.company_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Notifiée le : {tx.created_at?.slice(0, 10) ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due le : {tx.due_date ?? "—"}
                        </div>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="p-4 font-semibold">
                        {(Number(tx.amount) || 0).toLocaleString()} €
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-muted-foreground">
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