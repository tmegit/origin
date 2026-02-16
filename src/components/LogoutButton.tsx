"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-muted-foreground hover:text-black transition"
    >
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </button>
  )
}