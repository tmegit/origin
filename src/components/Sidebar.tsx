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
  X,
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
  const [isOpen, setIsOpen] = useState(false)

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
    <>
      {/* ===== MOBILE OVERLAY ===== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed lg:relative
          z-[50]
          inset-y-0 left-0
          w-64
          bg-white
          border-r border-gray-200
          px-6 py-8
          flex flex-col
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ===== MOBILE CLOSE BUTTON ===== */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <span className="text-sm font-medium text-gray-500">
            Navigation
          </span>
          <button onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* ===== LOGO ===== */}
        <Link href="/" className="flex items-center gap-3 mb-10">
          <Image
            src="/icon.svg"
            alt="The Sov Origin"
            width={28}
            height={28}
            priority
          />
          <div className="text-lg tracking-tight">
            <span className="font-medium text-gray-800">The Sov </span>
            <span className="font-semibold text-gray-900">Origin</span>
          </div>
        </Link>

        {/* ===== NAVIGATION ===== */}
        <nav className="space-y-1 flex-1">
          {menu.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all
                  ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Icon size={16} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ===== LOGOUT ===== */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition w-full"
          >
            <LogOut size={16} />
            <span>{loading ? "Déconnexion..." : "Se déconnecter"}</span>
          </button>
        </div>
      </aside>

      {/* ===== MOBILE TRIGGER BUTTON ===== */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
      >
        <LayoutDashboard size={18} />
      </button>
    </>
  )
}