"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { format, subDays, isBefore, startOfDay } from "date-fns"
import { id } from "date-fns/locale"
import { Search, Save, CheckCircle } from "lucide-react"
import type { Siswa, ApiResponse, StatusAbsensi } from "@/types"

const STATUS_OPTIONS: { value: StatusAbsensi; label: string }[] = [
  { value: "H", label: "Hadir" },
  { value: "S", label: "Sakit" },
  { value: "I", label: "Izin" },
  { value: "A", label: "Alpa" },
  { value: "T", label: "Terlambat" },
]

const MAX_BACKDATE_DAYS = 10

export default function AbsensiManualPage() {
  const { token, user, isAdmin } = useAuth()

  const [searchNisn, setSearchNisn] = useState("")
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedStatus, setSelectedStatus] = useState<StatusAbsensi>("H")
  const [keterangan, setKeterangan] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const maxBackdate = useMemo(
    () => format(subDays(new Date(), MAX_BACKDATE_DAYS), "yyyy-MM-dd"),
    []
  )

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  const isDateBlocked = useMemo(() => {
    const sel = new Date(selectedDate)
    const min = startOfDay(subDays(new Date(), MAX_BACKDATE_DAYS))
    const max = startOfDay(new Date())
    return isBefore(sel, min) || isBefore(max, sel)
  }, [selectedDate])

  const {
    data: siswaResults,
    isLoading: searching,
    refetch: doSearch,
  } = useQuery({
    queryKey: ["siswa-search", searchNisn, user?.id_kelas],
    queryFn: () => {
      const params = new URLSearchParams({ q: searchNisn })
      if (!isAdmin && user?.id_kelas) {
        params.set("id_kelas", String(user.id_kelas))
      }
      return api.get<ApiResponse<Siswa[]>>(`/siswa/search?${params.toString()}`, token ?? undefined)
    },
    enabled: false,
  })

  const handleSearch = () => {
    if (searchNisn.trim().length < 2) return
    doSearch()
  }

  const saveMutation = useMutation({
    mutationFn: (payload: {
      id_siswa: number
      tanggal: string
      status: StatusAbsensi
      keterangan?: string
    }) =>
      api.post<ApiResponse<null>>("/absensi/manual", payload, token ?? undefined),
    onSuccess: () => {
      setSuccessMsg("Data kehadiran berhasil disimpan")
      setSelectedSiswa(null)
      setSearchNisn("")
      setKeterangan("")
      setTimeout(() => setSuccessMsg(""), 3000)
    },
  })

  const handleSave = () => {
    if (!selectedSiswa || isDateBlocked) return
    saveMutation.mutate({
      id_siswa: selectedSiswa.id,
      tanggal: selectedDate,
      status: selectedStatus,
      keterangan: keterangan || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Input Kehadiran Manual</h2>
        <p className="text-sm text-gray-500">
          Input/titip absen manual untuk siswa (maksimal H-{MAX_BACKDATE_DAYS} hari)
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cari Siswa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Cari NISN atau nama..."
                value={searchNisn}
                onChange={(e) => setSearchNisn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {siswaResults?.data && (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border">
                {siswaResults.data.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    Siswa tidak ditemukan
                  </p>
                ) : (
                  siswaResults.data.map((siswa) => (
                    <button
                      key={siswa.id}
                      onClick={() => setSelectedSiswa(siswa)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                        selectedSiswa?.id === siswa.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <p className="font-medium">{siswa.nama}</p>
                      <p className="text-xs text-gray-500">
                        {siswa.nisn} &middot; {siswa.nama_kelas}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detail Kehadiran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSiswa ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Pilih siswa terlebih dahulu
              </p>
            ) : (
              <>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="font-medium">{selectedSiswa.nama}</p>
                  <p className="text-sm text-gray-500">
                    {selectedSiswa.nisn} &middot; {selectedSiswa.nama_kelas}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Absensi</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={maxBackdate}
                    max={today}
                  />
                  {isDateBlocked && (
                    <p className="text-xs text-red-600">
                      Tanggal melebihi batas maksimal H-{MAX_BACKDATE_DAYS} atau di masa depan
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status Kehadiran</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(v) => setSelectedStatus(v as StatusAbsensi)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Keterangan (opsional)</Label>
                  <Input
                    placeholder="Contoh: Surat dokter"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                  />
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={isDateBlocked || saveMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      {saveMutation.isPending ? "Menyimpan..." : "Simpan Kehadiran"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Simpan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Simpan status <strong>{STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}</strong>{" "}
                        untuk <strong>{selectedSiswa.nama}</strong> pada tanggal{" "}
                        <strong>
                          {format(new Date(selectedDate + "T00:00:00"), "dd MMMM yyyy", { locale: id })}
                        </strong>
                        ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSave}>
                        Simpan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
