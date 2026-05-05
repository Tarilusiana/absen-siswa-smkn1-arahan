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
import { Pencil, Trash2, Plus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { WaliKelas, Kelas, ApiResponse } from "@/types"

export default function WaliKelasPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WaliKelas | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WaliKelas | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [namaWali, setNamaWali] = useState("")
  const [idKelas, setIdKelas] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["wali-kelas"],
    queryFn: () => api.get<ApiResponse<WaliKelas[]>>("/wali-kelas", token ?? undefined),
    enabled: !!token,
  })

  const { data: kelasList } = useQuery({
    queryKey: ["kelas-list"],
    queryFn: () => api.get<ApiResponse<Kelas[]>>("/kelas", token ?? undefined),
    enabled: !!token,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: { username: string; password?: string; nama: string; id_kelas: number }) =>
      editing
        ? api.put<ApiResponse<WaliKelas>>(`/wali-kelas/${editing.id}`, payload, token ?? undefined)
        : api.post<ApiResponse<WaliKelas>>("/wali-kelas", payload, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wali-kelas"] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete<ApiResponse<null>>(`/wali-kelas/${id}`, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wali-kelas"] })
      setDeleteTarget(null)
    },
  })

  const resetForm = () => {
    setOpen(false)
    setEditing(null)
    setUsername("")
    setPassword("")
    setNamaWali("")
    setIdKelas("")
  }

  const handleEdit = (wk: WaliKelas) => {
    setEditing(wk)
    setUsername(wk.username)
    setNamaWali(wk.nama)
    setIdKelas(String(wk.id_kelas))
    setOpen(true)
  }

  const handleSave = () => {
    const payload: { username: string; password?: string; nama: string; id_kelas: number } = {
      username,
      nama: namaWali,
      id_kelas: parseInt(idKelas),
    }
    if (password) payload.password = password
    saveMutation.mutate(payload)
  }

  const columns: ColumnDef<WaliKelas>[] = [
    { accessorKey: "username", header: "Username" },
    { accessorKey: "nama", header: "Nama" },
    { accessorKey: "nama_kelas", header: "Kelas" },
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
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Wali Kelas</h2>
          <p className="text-sm text-gray-500">Tambah, ubah, dan hapus data wali kelas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Tambah Wali Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Wali Kelas" : "Tambah Wali Kelas"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  placeholder="Username login"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password {editing && "(kosongkan jika tidak diubah)"}</Label>
                <Input
                  type="password"
                  placeholder={editing ? "Password baru (opsional)" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Wali Kelas</Label>
                <Input
                  placeholder="Nama lengkap"
                  value={namaWali}
                  onChange={(e) => setNamaWali(e.target.value)}
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
          <CardTitle>Daftar Wali Kelas</CardTitle>
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
            <AlertDialogTitle>Hapus Wali Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin hapus wali kelas <strong>{deleteTarget?.nama}</strong>? Data tidak dapat dikembalikan.
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
