"use client"

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type Point = {
  latitude: number
  longitude: number
}

export default function LeafletInnerMap({
  points = [],
}: {
  points: Point[]
}) {
  console.log("CLIENT POINTS =", points?.length)
  console.log("CLIENT FIRST POINT =", points?.[0])

  if (!points || points.length === 0) {
    return <div>No points</div>
  }

  return (
    <MapContainer
      center={[46.15, -1.15]}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((p, i) => (
<CircleMarker
  key={i}
  center={[p.latitude, p.longitude]}
  radius={2}
  pathOptions={{
    color: "#b91c1c",
    fillColor: "#b91c1c",
    fillOpacity: 0.6,
    weight: 0,
  }}
/>
      ))}
    </MapContainer>
  )
}
