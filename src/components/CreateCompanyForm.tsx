"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateCompanyForm() {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nafCodes, setNafCodes] = useState<any[]>([])

  const [form, setForm] = useState({
    company_name: "",
    company_address: "",
    geo_name: "",
    naf_code: "",
    naf_label: "",
  })

  // Charger les NAF
  useEffect(() => {
    const loadNaf = async () => {
      const { data } = await supabase
        .from("naf_codes")
        .select("code, label")
        .order("code", { ascending: true })

      setNafCodes(data ?? [])
    }

    loadNaf()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

const { error } = await supabase.from("companies").insert({
  company_name: form.company_name,
  company_address: form.company_address,
  geo_name: form.geo_name,
  naf_code: form.naf_code,
  naf_label: form.naf_label,
  company_formal_status: "formalized",
  company_status: "open",
  detection_source: "Manual",
})

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setOpen(false)
    router.refresh()
  }

  // =========================
  // BOUTON SEUL
  // =========================

  if (!open) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
        >
          <Plus size={16} />
          Ajouter une entreprise
        </button>
      </div>
    )
  }

  // =========================
  // FORMULAIRE
  // =========================

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6 border">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Créer une entreprise
        </h2>

        <button
          onClick={() => setOpen(false)}
          className="text-gray-500 hover:text-black"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="text-sm font-medium">
            Nom de l'entreprise
          </label>
          <input
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.company_name}
            onChange={(e) =>
              setForm({ ...form, company_name: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Adresse
          </label>
          <input
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.company_address}
            onChange={(e) =>
              setForm({ ...form, company_address: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Ville / Territoire
          </label>
          <input
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.geo_name}
            onChange={(e) =>
              setForm({ ...form, geo_name: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Secteur d'activité (NAF)
          </label>
          <select
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.naf_code}
            onChange={(e) => {
              const selected = nafCodes.find(
                (n) => n.code === e.target.value
              )
              setForm({
                ...form,
                naf_code: selected?.code ?? "",
                naf_label: selected?.label ?? "",
              })
            }}
            required
          >
            <option value="">
              Sélectionner un code NAF
            </option>

            {nafCodes.map((naf) => (
              <option key={naf.code} value={naf.code}>
                {naf.code} — {naf.label}
              </option>
            ))}
          </select>
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading
            ? "Création..."
            : "Créer l'entreprise"}
        </button>
      </form>
    </div>
  )
}