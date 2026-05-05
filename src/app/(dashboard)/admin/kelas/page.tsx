"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Pencil, Trash2, Plus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Kelas, ApiResponse } from "@/types"

export default function KelasPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Kelas | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null)
  const [nama, setNama] = useState("")
  const [tingkat, setTingkat] = useState("10")
  const [jurusan, setJurusan] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["kelas"],
    queryFn: () => api.get<ApiResponse<Kelas[]>>("/kelas", token ?? undefined),
    enabled: !!token,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: { nama: string; tingkat: number; jurusan: string }) =>
      editing
        ? api.put<ApiResponse<Kelas>>(`/kelas/${editing.id}`, payload, token ?? undefined)
        : api.post<ApiResponse<Kelas>>("/kelas", payload, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete<ApiResponse<null>>(`/kelas/${id}`, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] })
      setDeleteTarget(null)
    },
  })

  const resetForm = () => {
    setOpen(false)
    setEditing(null)
    setNama("")
    setTingkat("10")
    setJurusan("")
  }

  const handleEdit = (kelas: Kelas) => {
    setEditing(kelas)
    setNama(kelas.nama)
    setTingkat(String(kelas.tingkat))
    setJurusan(kelas.jurusan)
    setOpen(true)
  }

  const handleSave = () => {
    saveMutation.mutate({
      nama,
      tingkat: parseInt(tingkat),
      jurusan,
    })
  }

  const columns: ColumnDef<Kelas>[] = [
    { accessorKey: "nama", header: "Nama Kelas" },
    { accessorKey: "tingkat", header: "Tingkat" },
    { accessorKey: "jurusan", header: "Jurusan" },
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
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Kelas</h2>
          <p className="text-sm text-gray-500">Tambah, ubah, dan hapus data kelas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setNama(""); setTingkat("10"); setJurusan("") }}>
              <Plus className="h-4 w-4" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Kelas</Label>
                <Input
                  placeholder="Contoh: X RPL 1"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tingkat</Label>
                <Input
                  type="number"
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Jurusan</Label>
                <Input
                  placeholder="Contoh: RPL"
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                />
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
          <CardTitle>Daftar Kelas</CardTitle>
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
            <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin hapus kelas <strong>{deleteTarget?.nama}</strong>? Data tidak dapat dikembalikan.
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
    </div>
  )
}
