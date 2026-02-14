"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "Carte", href: "/map" },
  { name: "Entreprises", href: "/companies" },
  { name: "Transactions", href: "/transactions" },
  { name: "Dirigeants", href: "/directors" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white h-screen p-6 hidden md:flex flex-col">
      
      <div className="text-xl font-semibold tracking-tight mb-10">
        ORIGIN
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-2 rounded-md transition-colors",
              pathname === item.href
                ? "bg-muted font-medium"
                : "hover:bg-muted/60 text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 text-xs text-muted-foreground">
        Origin v0.1
      </div>
    </aside>
  )
}
