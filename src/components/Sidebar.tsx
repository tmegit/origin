// src/components/Sidebar.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  User,
  Shield,
  LogOut,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useState } from "react"

const menu = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: CreditCard },
  { label: "Entreprises", href: "/companies", icon: Building2 },
  { label: "Directeurs", href: "/directors", icon: User },
  { label: "Collecteurs", href: "/agents", icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()
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
    <aside className="w-64 h-screen bg-white border-r p-6 flex flex-col">
      {/* LOGO */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <Image
          src="/icon.svg"
          alt="The Sov Origin"
          width={28}
          height={28}
          priority
        />
        <div className="text-lg leading-none">
          <span className="font-normal">The Sov </span>
          <span className="font-bold">Origin</span>
        </div>
      </Link>

      {/* NAVIGATION */}
      <nav className="space-y-2 flex-1">
        {menu.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* LOGOUT BUTTON (bas du sidebar) */}
      <div className="pt-6 border-t">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 w-full transition"
        >
          <LogOut size={18} />
          <span>{loading ? "Déconnexion..." : "Se déconnecter"}</span>
        </button>
      </div>
    </aside>
  )
}