"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export default function AddTransactionForm({
  companyId,
}: {
  companyId: string
}) {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    type: "",
    type_details: "",
    amount: "",
    due_date: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.rpc("create_transaction", {
      p_company_id: companyId,
      p_type: form.type,
      p_type_details: form.type_details,
      p_amount: Number(form.amount),
      p_due_date: form.due_date || null,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
        <h3 className="font-semibold mb-2">
          Ajouter une transaction
        </h3>
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Nouvelle transaction
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow space-y-6"
    >
      <h3 className="text-lg font-semibold">
        Nouvelle transaction
      </h3>

      {/* TYPE */}
      <div>
        <label className="text-sm font-medium">
          Type de transaction
        </label>
        <select
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
          required
        >
          <option value="">Sélectionner</option>
          <option value="tax_notification">
            Notification fiscale
          </option>
          <option value="tax_payment">
            Paiement fiscal
          </option>
        </select>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-sm font-medium">
          Détail
        </label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.type_details}
          onChange={(e) =>
            setForm({ ...form, type_details: e.target.value })
          }
        />
      </div>

      {/* MONTANT */}
      <div>
        <label className="text-sm font-medium">
          Montant (€)
        </label>
        <input
          type="number"
          step="0.01"
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
          required
        />
      </div>

      {/* DATE */}
      <div>
        <label className="text-sm font-medium">
          Date d'échéance
        </label>
        <input
          type="date"
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.due_date}
          onChange={(e) =>
            setForm({ ...form, due_date: e.target.value })
          }
        />
      </div>

      <button
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Création..." : "Créer la transaction"}
      </button>
    </form>
  )
}