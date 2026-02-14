"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)

const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
)

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MapPage() {
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("companies")
        .select("company_name, latitude, longitude, company_compliance_status")
        .not("latitude", "is", null)
        .limit(500)

      setCompanies(data || [])
    }

    fetchData()
  }, [])

  return (
    <div className="h-[80vh] w-full">
      <MapContainer
        center={[46.1603, -1.1511]}
        zoom={11}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {companies.map((company, index) => (
          <CircleMarker
            key={index}
            center={[company.latitude, company.longitude]}
            radius={5}
            pathOptions={{
              color:
                company.company_compliance_status === "late"
                  ? "red"
                  : "green",
            }}
          >
            <Popup>
              <strong>{company.company_name}</strong>
              <br />
              Statut: {company.company_compliance_status}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
