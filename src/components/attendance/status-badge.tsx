import { Badge } from "@/components/ui/badge"
import type { StatusAbsensi } from "@/types"

const statusConfig: Record<StatusAbsensi, { label: string; variant: "success" | "destructive" | "warning" | "secondary" | "default" }> = {
  H: { label: "Hadir", variant: "success" },
  S: { label: "Sakit", variant: "warning" },
  I: { label: "Izin", variant: "default" },
  A: { label: "Alpa", variant: "destructive" },
  T: { label: "Terlambat", variant: "secondary" },
}

export function StatusBadge({ status }: { status: StatusAbsensi }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
