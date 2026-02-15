"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  User,
  Shield,
} from "lucide-react"

const menu = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: CreditCard },
  { label: "Entreprises", href: "/companies", icon: Building2 },
  { label: "Directeurs", href: "/directors", icon: User },
  { label: "Collecteurs", href: "/agents", icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-white border-r p-6 flex flex-col">
      <div className="text-xl font-bold mb-8">Origin</div>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/")

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
    </aside>
  )
}