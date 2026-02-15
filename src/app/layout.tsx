// src/app/layout.tsx
import "./globals.css"
import Sidebar from "@/components/Sidebar"

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
        <Sidebar />

        <main className="flex-1 p-8">
          {children}
        </main>
      </body>
    </html>
  )
}