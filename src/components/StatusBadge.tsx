type Props = {
  status: "validated" | "pending" | "late"
}

export default function StatusBadge({ status }: Props) {
  const styles =
    status === "validated"
      ? "bg-green-100 text-green-700"
      : status === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700"

  const label =
    status === "validated"
      ? "Validé"
      : status === "pending"
      ? "En attente"
      : "En retard"

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${styles}`}
    >
      {label}
    </span>
  )
}