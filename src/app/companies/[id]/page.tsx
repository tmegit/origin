import { createClient } from "@supabase/supabase-js"
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

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id_temp", id)
    .single()

  if (!company) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Entreprise introuvable</h1>
        <Link href="/companies">← Retour</Link>
      </div>
    )
  }

  // =========================
  // DIRECTORS FROM TRANSACTIONS
  // =========================

  const { data: txDirectors } = await supabase
    .from("transactions")
    .select(
      `
      directors:director_id (
        id_director,
        first_name,
        last_name
      )
    `
    )
    .eq("company_id", id)
    .not("director_id", "is", null)

  const directorsMap = new Map()

  txDirectors?.forEach((row: any) => {
    if (row.directors) {
      directorsMap.set(row.directors.id_director, row.directors)
    }
  })

  const directors = Array.from(directorsMap.values())

  // =========================
  // TRANSACTIONS
  // =========================

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      id_transaction,
      amount,
      status,
      created_at,
      due_date,
      type_details,
      directors:director_id (
        first_name,
        last_name
      )
    `
    )
    .eq("company_id", id)
    .order("due_date", { ascending: false })

  return (
    <div className="p-8 space-y-8">
      <Link href="/companies" className="text-sm text-muted-foreground">
        ← Retour aux entreprises
      </Link>

      <h1 className="text-3xl font-bold">
        {company.company_name ?? "[ND]"}
      </h1>

      <div className="text-sm text-muted-foreground">
        {company.company_address ??
          company.geocode_label ??
          company.geo_name ??
          "—"}
      </div>

      {/* DIRECTORS */}
      <Card>
        <CardHeader>
          <CardTitle>Directeurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {directors.length > 0 ? (
            directors.map((d: any) => (
              <div key={d.id_director}>
                <Link
                  href={`/directors/${d.id_director}`}
                  className="text-blue-600 hover:underline"
                >
                  {d.first_name} {d.last_name}
                </Link>
              </div>
            ))
          ) : (
            <div>—</div>
          )}
        </CardContent>
      </Card>

      {/* TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {(transactions ?? []).map((tx: any) => (
                <tr key={tx.id_transaction} className="border-b">
                  <td className="p-4">
                    <div className="font-medium">
                      {tx.type_details ?? "—"}
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