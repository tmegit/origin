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
      <body className="flex min-h-screen bg-gray-50">

        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN WRAPPER */}
        <div className="flex-1 flex flex-col min-h-screen">

          {/* HEADER GLOBAL */}
          <Header />

          {/* PAGE CONTENT */}
          <main className="flex-1 p-8">
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}