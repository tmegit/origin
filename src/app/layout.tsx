// src/app/layout.tsx
import "./globals.css"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"

export const metadata = {
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="h-screen overflow-hidden bg-[#f6f7f9] text-gray-900">
        <div className="flex h-full">
          {/* Sidebar */}
          <Sidebar />

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <Header />

            {/* Content (seul élément scrollable) */}
<main className="flex-1 overflow-y-auto">
  <div className="px-6 lg:px-8 py-8 max-w-[1400px] w-full">
    {children}
  </div>
</main>
          </div>
        </div>
      </body>
    </html>
  )
}