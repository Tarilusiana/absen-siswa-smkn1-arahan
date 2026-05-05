"use client"

import { useState, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import type { ApiResponse } from "@/types"

export default function ImportCsvPage() {
  const { token } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tipe, setTipe] = useState("siswa")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Pilih file terlebih dahulu")
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("tipe", tipe)
      return api.upload<ApiResponse<{ imported: number; errors: string[] }>>(
        "/import/csv",
        formData,
        token ?? undefined
      )
    },
    onSuccess: (res) => {
      if (res.success) {
        setMessage({
          type: "success",
          text: `Berhasil mengimpor ${res.data?.imported ?? 0} data.${res.data?.errors?.length ? ` ${res.data.errors.length} error ditemukan.` : ""}`,
        })
        setSelectedFile(null)
        if (fileRef.current) fileRef.current.value = ""
      }
    },
    onError: (err: Error) => {
      setMessage({ type: "error", text: err.message })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && !file.name.endsWith(".csv")) {
      setMessage({ type: "error", text: "File harus berformat CSV" })
      return
    }
    setSelectedFile(file ?? null)
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import CSV</h2>
        <p className="text-sm text-gray-500">
          Unggah file CSV untuk import data secara massal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unggah File CSV</CardTitle>
          <CardDescription>
            Format CSV harus sesuai template: kolom NISN, Nama, ID Kelas (untuk siswa) atau Nama, Tingkat, Jurusan (untuk kelas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe Data</Label>
            <Select value={tipe} onValueChange={setTipe}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="siswa">Data Siswa</SelectItem>
                <SelectItem value="kelas">Data Kelas</SelectItem>
                <SelectItem value="wali_kelas">Data Wali Kelas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File CSV</Label>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-500">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : "Pilih file CSV..."}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!selectedFile || importMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                {importMutation.isPending ? "Mengimpor..." : "Import"}
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-semibold">Data Siswa</h4>
            <pre className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              nisn,nama,id_kelas{"\n"}
              1234567890,Budi Santoso,1{"\n"}
              0987654321,Siti Aminah,2
            </pre>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Data Kelas</h4>
            <pre className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              nama,tingkat,jurusan{"\n"}
              X RPL 1,10,RPL{"\n"}
              XI TKJ 2,11,TKJ
            </pre>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Data Wali Kelas</h4>
            <pre className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              username,password,nama,id_kelas{"\n"}
              wali_x_rpl,pass123,Bpk. Ahmad,1{"\n"}
              wali_xi_tkj,pass456,Ibu. Dewi,2
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
