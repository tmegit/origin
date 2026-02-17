"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Loader2 } from "lucide-react"

type Detection = {
  id: string
  name: string
  activity: string
  latitude: number
  longitude: number
  confidence: number
}

const PHASES = [
  "Decoding stream",
  "Stabilization",
  "Object detection",
  "OCR storefront",
  "Geocoding",
  "Writing to registry",
]

export default function DetectionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [progressKm, setProgressKm] = useState(0)
  const [detections, setDetections] = useState<Detection[]>([])

  // Telemetry states
  const [gpu, setGpu] = useState(0)
  const [fps, setFps] = useState(0)
  const [frames, setFrames] = useState(0)
  const [phaseIdx, setPhaseIdx] = useState(0)

  const SPEED_KMH = 25
  const SHOPS_PER_KM = 4.5

  const startSimulation = () => {
    setRunning(true)
    setProgressKm(0)
    setDetections([])
    setGpu(60)
    setFps(24)
    setFrames(0)
    setPhaseIdx(0)
  }

  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      // Progress
      setProgressKm((prev) => {
        const nextKm = Math.min(2, prev + 0.1)

        const expectedDetections = Math.floor(nextKm * SHOPS_PER_KM)

        setDetections((prevDetections) => {
          if (expectedDetections <= prevDetections.length)
            return prevDetections

          const newDetection: Detection = {
            id: Math.random().toString(36).substring(2) + Date.now(),
            name: generateShopName(),
            activity: generateActivity(),
            latitude: randomLat(),
            longitude: randomLng(),
            confidence: Number((0.82 + Math.random() * 0.15).toFixed(2)),
          }

          return [...prevDetections, newDetection]
        })

        if (nextKm >= 2) {
          setRunning(false)
        }

        return nextKm
      })

      // Fake telemetry animation
      setGpu((g) =>
        Math.max(35, Math.min(96, Math.round(g + (Math.random() * 6 - 3))))
      )

      setFps((f) =>
        Math.max(12, Math.min(30, Math.round(f + (Math.random() * 3 - 1.5))))
      )

      setFrames((fr) => fr + (18 + Math.round(Math.random() * 8)))

      setPhaseIdx((i) => (i + 1) % PHASES.length)
    }, 400)

    return () => clearInterval(interval)
  }, [running])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Détection par Vision IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Analyse automatisée des commerces via flux vidéo embarqué
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">

        {/* LEFT PANEL */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Importer une vidéo</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center space-y-6">

            {!file ? (
              <label className="border-2 border-dashed rounded-2xl p-10 w-full cursor-pointer hover:bg-gray-50 transition text-center">
                <UploadCloud className="mx-auto mb-4" size={32} />
                <p className="font-medium">Glisser-déposer une vidéo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Simulation locale — Computer Vision embarqué
                </p>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0])
                    }
                  }}
                />
              </label>
            ) : (
              <div className="space-y-6">

                {/* FAKE VIDEO FRAME */}
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">

                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(#ffffff22_1px,transparent_1px),linear-gradient(90deg,#ffffff22_1px,transparent_1px)] bg-[size:20px_20px]" />

                  {running && (
                    <div className="absolute inset-0">
                      <div className="absolute w-full h-[2px] bg-green-400 animate-[scan_2s_linear_infinite]" />
                    </div>
                  )}

                  {running && detections.length > 0 && (
                    <div
                      className="absolute border-2 border-green-400 rounded-sm animate-pulse"
                      style={{
                        top: `${20 + Math.random() * 40}%`,
                        left: `${10 + Math.random() * 60}%`,
                        width: "120px",
                        height: "60px",
                      }}
                    />
                  )}

                  <div className="absolute bottom-2 left-2 text-xs text-green-400 font-mono">
                    SPEED 25km/h — {progressKm.toFixed(2)} km
                  </div>
                </div>

                {!running ? (
                  <button
                    onClick={startSimulation}
                    className="px-4 py-2 bg-black text-white rounded-xl"
                  >
                    Lancer la détection
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    Analyse terrain en cours…
                  </div>
                )}

              </div>
            )}

          </CardContent>
        </Card>

        {/* RIGHT PANEL */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>
              Résultats ({detections.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-4 text-sm pr-2">

            {/* TELEMETRY */}
            {running && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="border rounded-lg p-3">
                    <div className="text-muted-foreground">Distance</div>
                    <div className="font-semibold">{progressKm.toFixed(1)} km</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-muted-foreground">GPU</div>
                    <div className="font-semibold">{gpu}%</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-muted-foreground">FPS</div>
                    <div className="font-semibold">{fps}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-muted-foreground">Frames</div>
                    <div className="font-semibold">{frames.toLocaleString()}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-muted-foreground">Inference</div>
                    <div className="font-semibold">
                      {PHASES[phaseIdx]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Model inference running…
                </div>
              </>
            )}

            {detections.map((d) => (
              <div
                key={d.id}
                className="border rounded-xl p-4 space-y-1"
              >
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.activity}
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.latitude.toFixed(5)} — {d.longitude.toFixed(5)}
                </div>
                <div className="text-xs text-green-600">
                  Confiance : {(d.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}

            {!running && detections.length === 0 && (
              <div className="text-xs text-muted-foreground">
                Aucune détection pour le moment
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}

/* ===== MOCK GENERATORS ===== */

function randomLat() {
  return 14.69 + Math.random() * 0.02
}

function randomLng() {
  return -17.44 + Math.random() * 0.02
}

function generateShopName() {
  const names = [
    "Boulangerie Ndiaye",
    "Boutique Dakar Market",
    "Pharmacie du Centre",
    "Café Teranga",
    "Alimentation Express",
  ]
  return names[Math.floor(Math.random() * names.length)]
}

function generateActivity() {
  const activities = [
    "Alimentation générale",
    "Pharmacie",
    "Restauration",
    "Textile",
    "Services divers",
  ]
  return activities[Math.floor(Math.random() * activities.length)]
}