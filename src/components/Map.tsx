"use client"

import dynamic from "next/dynamic"

const LeafletInnerMap = dynamic(() => import("./LeafletInnerMap"), { ssr: false })

type Point = {
  id: string
  lat: number
  lng: number
  label?: string
}

export default function Map({ points }: { points: Point[] }) {
  return <LeafletInnerMap points={points} />
}
