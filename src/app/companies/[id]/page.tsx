import { createClient } from "@supabase/supabase-js"
import FormalizeCompanyForm from "@/components/FormalizeCompanyForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import {
  ActivityStatusBadge,
  FormalStatusBadge,
} from "@/components/CompanyBadges"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function CompanyDetail(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  // =========================
  // COMPANY + DIRECTOR
  // =========================
  const { data: company } = await supabase
    .from("companies")
    .select(`
      id_temp,
      company_name,
      company_address,
      geo_name,
      geocode_label,
      company_formal_status,
      company_status,
      director_id,
      directors:director_id (
        id_director,
        first_name,
        last_name
      )
    `)
    .eq("id_temp", id)
    .single()

  if (!company) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Entreprise introuvable</h1>
        <Link
          href="/companies"
          className="text-sm text-muted-foreground hover:text-black"
        >
          ← Retour aux entreprises
        </Link>
      </div>
    )
  }

  // ⚠️ Supabase peut retourner un array
  const director = Array.isArray(company.directors)
    ? company.directors[0]
    : company.directors

  // =========================
  // TRANSACTIONS
  // =========================
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      id_transaction,
      amount,
      status,
      created_at,
      due_date,
      type_details
    `)
    .eq("company_id", id)
    .order("due_date", { ascending: false })

  return (
    <div className="p-8 space-y-8">

      {/* RETOUR */}
      <Link
        href="/companies"
        className="text-sm text-muted-foreground hover:text-black"
      >
        ← Retour aux entreprises
      </Link>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          {company.company_name ?? "[ND]"}
        </h1>
        <div className="text-sm text-muted-foreground">
          {company.company_address ??
            company.geocode_label ??
            company.geo_name ??
            "—"}
        </div>
      </div>

      {/* FORMALISATION */}
      {company.company_formal_status !== "formalized" && (
        <FormalizeCompanyForm companyId={company.id_temp} />
      )}

      {/* INFO GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* ENTREPRISE */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-muted-foreground">ID</div>
              <div className="font-medium">{company.id_temp}</div>
            </div>

            <div>
              <div className="text-muted-foreground">Ville</div>
              <div className="font-medium">{company.geo_name ?? "—"}</div>
            </div>

            <div>
              <div className="text-muted-foreground">Formalisation</div>
              <FormalStatusBadge value={company.company_formal_status} />
            </div>

            <div>
              <div className="text-muted-foreground">Activité</div>
              <ActivityStatusBadge value={company.company_status} />
            </div>
          </CardContent>
        </Card>

        {/* DIRECTEUR */}
        <Card>
          <CardHeader>
            <CardTitle>Directeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
              <div className="text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="p-4">Transaction</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Montant</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {(transactions ?? []).map((tx: any) => (
                <tr key={tx.id_transaction} className="border-b">
                  <td className="p-4">
                    <div className="font-medium">
                      {tx.type_details ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notifiée le : {tx.created_at?.slice(0, 10)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Due le : {tx.due_date ?? "—"}
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
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  )
}