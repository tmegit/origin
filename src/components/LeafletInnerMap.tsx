"use client"

import {
  MapContainer,
  TileLayer,
  CircleMarker,
} from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"

export type Point = {
  id: string
  lat: number
  lng: number
}

export default function LeafletInnerMap({
  points = [],
}: {
  points?: Point[]
}) {
  const safePoints =
    (points ?? []).filter(
      (p) =>
        typeof p?.lat === "number" &&
        Number.isFinite(p.lat) &&
        typeof p?.lng === "number" &&
        Number.isFinite(p.lng)
    )

  if (safePoints.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No points
      </div>
    )
  }

  const center: LatLngExpression = [46.15, -1.15]

  return (
    <div className="relative w-full h-full z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {safePoints.map((p) => {
          const position: LatLngExpression = [p.lat, p.lng]

          return (
            <CircleMarker
              key={p.id}
              center={position}
              pathOptions={{
                color: "#b91c1c",
                fillColor: "#b91c1c",
                fillOpacity: 0.6,
                weight: 0,
              }}
              radius={2}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}