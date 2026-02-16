"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export default function FormalizeCompanyForm({
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
    first_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    start_mandate_date: "",
    nationality: "",
    phone: "",
    email: "",
    postal_address: "",
    company_address: "", // ✅ AJOUTÉ
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.rpc(
      "formalize_company_with_director",
      {
        p_company_id: companyId,
        p_first_name: form.first_name,
        p_last_name: form.last_name,
        p_gender: form.gender,
        p_birth_date: form.birth_date,
        p_start_mandate_date: form.start_mandate_date,
        p_nationality: form.nationality,
        p_phone: form.phone,
        p_email: form.email,
        p_postal_address: form.postal_address,
        p_company_address: form.company_address, // ✅ IMPORTANT
      }
    )

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
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
        <h3 className="font-semibold mb-2">
          Formaliser cette entreprise
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Cette entreprise est détectée mais non formalisée.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Commencer la formalisation
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
        Informations du directeur
      </h3>

      {/* Identité */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Prénom</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.first_name}
            onChange={(e) =>
              setForm({ ...form, first_name: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Nom</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.last_name}
            onChange={(e) =>
              setForm({ ...form, last_name: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Genre */}
      <div>
        <label className="text-sm font-medium">Genre</label>
        <select
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.gender}
          onChange={(e) =>
            setForm({ ...form, gender: e.target.value })
          }
          required
        >
          <option value="">Sélectionner</option>
          <option value="M">Homme</option>
          <option value="F">Femme</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">
            Date de naissance
          </label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.birth_date}
            onChange={(e) =>
              setForm({ ...form, birth_date: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Date de début de mandat
          </label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.start_mandate_date}
            onChange={(e) =>
              setForm({ ...form, start_mandate_date: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Nationalité */}
      <div>
        <label className="text-sm font-medium">Nationalité</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.nationality}
          onChange={(e) =>
            setForm({ ...form, nationality: e.target.value })
          }
          required
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Téléphone</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Adresse dirigeant */}
      <div>
        <label className="text-sm font-medium">
          Adresse postale du dirigeant
        </label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.postal_address}
          onChange={(e) =>
            setForm({ ...form, postal_address: e.target.value })
          }
          required
        />
      </div>

      {/* Adresse entreprise */}
      <div>
        <label className="text-sm font-medium">
          Adresse complète de l’entreprise
        </label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mt-1"
          value={form.company_address}
          onChange={(e) =>
            setForm({ ...form, company_address: e.target.value })
          }
          required
        />
      </div>

      <button
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Formalisation..." : "Valider la formalisation"}
      </button>
    </form>
  )
}