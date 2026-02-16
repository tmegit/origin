"use client"

import GlobalSearch from "@/components/GlobalSearch"

export default function Header() {
  return (
    <header className="w-full h-16 border-b bg-white px-8 flex items-center justify-between">
      
      <div className="text-lg font-semibold">
        Administration
      </div>

      <GlobalSearch />

    </header>
  )
}