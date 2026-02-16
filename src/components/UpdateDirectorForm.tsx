"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

export default function UpdateDirectorForm({
  director,
}: {
  director: any
}) {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    first_name: director.first_name ?? "",
    last_name: director.last_name ?? "",
    gender: director.gender ?? "",
    birth_date: director.birth_date ?? "",
    nationality: director.nationality ?? "",
    phone: director.phone ?? "",
    email: director.email ?? "",
    postal_address: director.postal_address ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.rpc("update_director", {
      p_director_id: director.id_director,
      p_first_name: form.first_name,
      p_last_name: form.last_name,
      p_gender: form.gender,
      p_birth_date: form.birth_date,
      p_nationality: form.nationality,
      p_phone: form.phone,
      p_email: form.email,
      p_postal_address: form.postal_address,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-black transition"
      >
        <Pencil size={16} />
        Modifier
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute inset-0 bg-white p-6 rounded-xl shadow-xl z-10"
    >
      <h3 className="text-lg font-semibold mb-4">
        Modifier les informations
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          value={form.first_name}
          onChange={(e) =>
            setForm({ ...form, first_name: e.target.value })
          }
          placeholder="Prénom"
          className="border px-3 py-2 rounded"
          required
        />

        <input
          type="text"
          value={form.last_name}
          onChange={(e) =>
            setForm({ ...form, last_name: e.target.value })
          }
          placeholder="Nom"
          className="border px-3 py-2 rounded"
          required
        />
      </div>

      <input
        type="date"
        value={form.birth_date}
        onChange={(e) =>
          setForm({ ...form, birth_date: e.target.value })
        }
        className="w-full border px-3 py-2 rounded mt-3"
      />

      <input
        type="text"
        value={form.nationality}
        onChange={(e) =>
          setForm({ ...form, nationality: e.target.value })
        }
        placeholder="Nationalité"
        className="w-full border px-3 py-2 rounded mt-3"
      />

      <input
        type="text"
        value={form.phone}
        onChange={(e) =>
          setForm({ ...form, phone: e.target.value })
        }
        placeholder="Téléphone"
        className="w-full border px-3 py-2 rounded mt-3"
      />

      <input
        type="email"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
        placeholder="Email"
        className="w-full border px-3 py-2 rounded mt-3"
      />

      <input
        type="text"
        value={form.postal_address}
        onChange={(e) =>
          setForm({ ...form, postal_address: e.target.value })
        }
        placeholder="Adresse"
        className="w-full border px-3 py-2 rounded mt-3"
      />

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-4 py-2 border rounded"
        >
          Annuler
        </button>

        <button
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  )
}