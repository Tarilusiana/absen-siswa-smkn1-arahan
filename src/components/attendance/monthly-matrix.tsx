"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MatriksRecord } from "@/types"
import { cn } from "@/lib/utils"

const statusColor: Record<string, string> = {
  H: "bg-emerald-100 text-emerald-800",
  T: "bg-gray-200 text-gray-700",
  S: "bg-amber-100 text-amber-800",
  I: "bg-blue-100 text-blue-800",
  A: "bg-red-100 text-red-800",
}

const statusLabel: Record<string, string> = {
  H: "H",
  T: "T",
  S: "S",
  I: "I",
  A: "A",
}

interface MonthlyMatrixProps {
  data: MatriksRecord[]
  month: number
  year: number
  onPrint?: () => void
  onExportCsv?: () => void
}

export function MonthlyMatrix({ data, month, year, onPrint, onExportCsv }: MonthlyMatrixProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Laporan Kehadiran - {new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onExportCsv}
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Export CSV
          </button>
          <button
            onClick={onPrint}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Cetak Laporan
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-white min-w-[40px]">No</TableHead>
              <TableHead className="sticky left-10 z-10 bg-white min-w-[80px]">NISN</TableHead>
              <TableHead className="sticky left-[136px] z-10 bg-white min-w-[160px]">Nama</TableHead>
              {dayHeaders.map((day) => (
                <TableHead key={day} className="min-w-[36px] text-center text-xs">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3 + daysInMonth} className="py-8 text-center text-gray-500">
                  Tidak ada data kehadiran
                </TableCell>
              </TableRow>
            ) : (
              data.map((record, idx) => (
                <TableRow key={record.siswa_id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{record.nisn}</TableCell>
                  <TableCell className="font-medium">{record.nama}</TableCell>
                  {dayHeaders.map((day) => {
                    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const status = record.status_per_tanggal[dateKey]
                    return (
                      <TableCell key={day} className="text-center">
                        {status ? (
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold",
                              statusColor[status] || "bg-gray-100 text-gray-500"
                            )}
                          >
                            {statusLabel[status] || "-"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-xs font-semibold", statusColor["H"])}>H</span>
          <span>Hadir</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-xs font-semibold", statusColor["T"])}>T</span>
          <span>Terlambat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-xs font-semibold", statusColor["S"])}>S</span>
          <span>Sakit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-xs font-semibold", statusColor["I"])}>I</span>
          <span>Izin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-xs font-semibold", statusColor["A"])}>A</span>
          <span>Alpa</span>
        </div>
      </div>
    </div>
  )
}
