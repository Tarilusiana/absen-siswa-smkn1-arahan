"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable } from "@/components/data-table/data-table"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Siswa, Kelas, ApiResponse } from "@/types"

export default function SiswaPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Siswa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null)
  const [resetDeviceTarget, setResetDeviceTarget] = useState<Siswa | null>(null)
  const [nisn, setNisn] = useState("")
  const [nama, setNama] = useState("")
  const [idKelas, setIdKelas] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["siswa"],
    queryFn: () => api.get<ApiResponse<Siswa[]>>("/siswa", token ?? undefined),
    enabled: !!token,
  })

  const { data: kelasList } = useQuery({
    queryKey: ["kelas-list"],
    queryFn: () => api.get<ApiResponse<Kelas[]>>("/kelas", token ?? undefined),
    enabled: !!token,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: { nisn: string; nama: string; id_kelas: number }) =>
      editing
        ? api.put<ApiResponse<Siswa>>(`/siswa/${editing.id}`, payload, token ?? undefined)
        : api.post<ApiResponse<Siswa>>("/siswa", payload, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete<ApiResponse<null>>(`/siswa/${id}`, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] })
      setDeleteTarget(null)
    },
  })

  const resetDeviceMutation = useMutation({
    mutationFn: (id: number) =>
      api.post<ApiResponse<null>>(`/siswa/${id}/reset-device`, {}, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] })
      setResetDeviceTarget(null)
    },
  })

  const resetForm = () => {
    setOpen(false)
    setEditing(null)
    setNisn("")
    setNama("")
    setIdKelas("")
  }

  const handleEdit = (siswa: Siswa) => {
    setEditing(siswa)
    setNisn(siswa.nisn)
    setNama(siswa.nama)
    setIdKelas(String(siswa.id_kelas))
    setOpen(true)
  }

  const handleSave = () => {
    saveMutation.mutate({
      nisn,
      nama,
      id_kelas: parseInt(idKelas),
    })
  }

  const columns: ColumnDef<Siswa>[] = [
    { accessorKey: "nisn", header: "NISN" },
    { accessorKey: "nama", header: "Nama" },
    { accessorKey: "nama_kelas", header: "Kelas" },
    {
      accessorKey: "device_id",
      header: "Device ID",
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        return val ? (
          <span className="text-xs text-emerald-600">Terikat</span>
        ) : (
          <span className="text-xs text-gray-400">Belum terikat</span>
        )
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setResetDeviceTarget(row.original)}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Siswa</h2>
          <p className="text-sm text-gray-500">Tambah, ubah, hapus data siswa, dan reset Device ID</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Tambah Siswa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>NISN</Label>
                <Input
                  placeholder="Masukkan NISN"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Siswa</Label>
                <Input
                  placeholder="Masukkan nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={idKelas} onValueChange={setIdKelas}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {(kelasList?.data ?? []).map((k) => (
                      <SelectItem key={k.id} value={String(k.id)}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-500">Memuat data...</p>
          ) : (
            <DataTable columns={columns} data={data?.data ?? []} searchKey="nama" />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin hapus siswa <strong>{deleteTarget?.nama}</strong>? Data tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetDeviceTarget} onOpenChange={() => setResetDeviceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Device ID</AlertDialogTitle>
            <AlertDialogDescription>
              Reset device ID untuk siswa <strong>{resetDeviceTarget?.nama}</strong>
              {" "}({resetDeviceTarget?.nisn})? Siswa akan dapat melakukan binding ulang di perangkat baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetDeviceTarget && resetDeviceMutation.mutate(resetDeviceTarget.id)}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
