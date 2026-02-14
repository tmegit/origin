"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

export default function RecoveryChart({
  validated,
  late,
  pending,
}: {
  validated: number
  late: number
  pending: number
}) {
  const data = [
    { name: "Validé", value: validated },
    { name: "En retard", value: late },
    { name: "En attente", value: pending },
  ]

  const COLORS = ["#16a34a", "#dc2626", "#f59e0b"]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={4}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
