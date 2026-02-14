"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

type Props = {
  validatedAmount: number
  pendingAmount: number
  lateAmount: number
  recoveryRate: number
}

export default function RecoveryChartClient({
  validatedAmount = 0,
  pendingAmount = 0,
  lateAmount = 0,
  recoveryRate = 0,
}: Props) {
  const data = [
    { name: "Validé", value: validatedAmount },
    { name: "En attente", value: pendingAmount },
    { name: "Retard", value: lateAmount },
  ]

  const COLORS = ["#16a34a", "#f59e0b", "#dc2626"]

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-6">
      <h2 className="text-lg font-semibold">
        Qualité du recouvrement
      </h2>

<div style={{ width: "100%", height: 280 }}>
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius={70}
        outerRadius={100}
        paddingAngle={4}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
</div>

      <div className="text-center">
        <div className="text-3xl font-bold">
          {recoveryRate.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500">
          taux de recouvrement
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <div>Validé : {validatedAmount.toLocaleString()} €</div>
        <div>En attente : {pendingAmount.toLocaleString()} €</div>
        <div>Retard : {lateAmount.toLocaleString()} €</div>
      </div>
    </div>
  )
}
