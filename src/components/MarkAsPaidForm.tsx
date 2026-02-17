"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MarkAsPaidForm({
  transactionId,
}: {
  transactionId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [method, setMethod] = useState("Carte Bancaire")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!date) return

    setLoading(true)

    await supabase
      .from("transactions")
      .update({
        status: "validated",
        paid_at: date,
        payment_method: method,
      })
      .eq("id_transaction", transactionId)

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:opacity-90 transition"
      >
        Encaisser le paiement
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">
              Enregistrer un paiement
            </h2>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Date de paiement
              </label>
              <input
                type="date"
                className="w-full border rounded-lg p-2 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Moyen de paiement
              </label>
              <select
                className="w-full border rounded-lg p-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Carte Bancaire</option>
                <option>Orange Money</option>
                <option>Espèce</option>
                <option>Chèque</option>
                <option>En ligne</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:opacity-90"
              >
                {loading ? "Enregistrement..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}