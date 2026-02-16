import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q || q.length < 2) {
    return NextResponse.json({ companies: [], directors: [], transactions: [] })
  }

  // ENTREPRISES
  const { data: companies } = await supabase
    .from("companies")
    .select("id_temp, company_name")
    .or(`company_name.ilike.%${q}%,id_temp.ilike.%${q}%`)
    .limit(5)

  // DIRECTEURS
  const { data: directors } = await supabase
    .from("directors")
    .select("id_director, first_name, last_name")
    .or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,id_director.ilike.%${q}%`
    )
    .limit(5)

  // TRANSACTIONS
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id_transaction")
    .ilike("id_transaction", `%${q}%`)
    .limit(5)

  return NextResponse.json({
    companies: companies ?? [],
    directors: directors ?? [],
    transactions: transactions ?? [],
  })
}