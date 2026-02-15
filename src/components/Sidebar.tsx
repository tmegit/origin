// src/components/Sidebar.tsx
"use client"

import Image from "next/image"
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

      <nav className="space-y-2">
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
    </aside>
  )
}