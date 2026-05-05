"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MonthlyMatrix } from "@/components/attendance/monthly-matrix"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import type { MatriksRecord, Kelas, ApiResponse } from "@/types"

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
]

export default function LaporanPage() {
  const { token, user, isAdmin } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [selectedKelas, setSelectedKelas] = useState<string>("")

  const { data: kelasList } = useQuery({
    queryKey: ["kelas-list"],
    queryFn: () => api.get<ApiResponse<Kelas[]>>("/kelas", token ?? undefined),
    enabled: !!token && isAdmin,
  })

  const { data: matriksData, isLoading } = useQuery({
    queryKey: ["laporan-matriks", month, year, selectedKelas, user?.id_kelas],
    queryFn: () => {
      const params = new URLSearchParams({ bulan: month, tahun: year })
      if (isAdmin && selectedKelas) {
        params.set("id_kelas", selectedKelas)
      } else if (!isAdmin && user?.id_kelas) {
        params.set("id_kelas", String(user.id_kelas))
      }
      return api.get<ApiResponse<MatriksRecord[]>>(
        `/laporan/matriks?${params.toString()}`,
        token ?? undefined
      )
    },
    enabled: !!token,
  })

  const classes = kelasList?.data ?? []
  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 3 }, (_, i) => String(y - i))
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCsv = () => {
    const params = new URLSearchParams({ bulan: month, tahun: year })
    if (selectedKelas) params.set("id_kelas", selectedKelas)
    window.open(`/api/laporan/csv?${params.toString()}`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan Kehadiran</h2>
        <p className="text-sm text-gray-500">
          Rekapitulasi matriks kehadiran bulanan per siswa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={selectedKelas}
                  onValueChange={setSelectedKelas}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map((k) => (
                      <SelectItem key={k.id} value={String(k.id)}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <MonthlyMatrix
              data={matriksData?.data ?? []}
              month={parseInt(month)}
              year={parseInt(year)}
              onPrint={handlePrint}
              onExportCsv={handleExportCsv}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
