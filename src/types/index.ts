export type Role = "admin" | "wali_kelas"

export type StatusAbsensi = "H" | "S" | "I" | "A" | "T"

export type JenisAbsen = "masuk" | "pulang"

export interface User {
  id: number
  username: string
  nama: string
  role: Role
  id_kelas?: number
  token: string
}

export interface LoginPayload {
  username: string
  password: string
  device_id?: string
}

export interface Kelas {
  id: number
  nama: string
  tingkat: number
  jurusan: string
}

export interface Siswa {
  id: number
  nisn: string
  nama: string
  id_kelas: number
  nama_kelas?: string
  device_id?: string | null
}

export interface WaliKelas {
  id: number
  username: string
  nama: string
  id_kelas: number
  nama_kelas?: string
}

export interface Absensi {
  id: number
  id_siswa: number
  nisn?: string
  nama_siswa?: string
  id_kelas?: number
  nama_kelas?: string
  tanggal: string
  jam_masuk?: string | null
  jam_pulang?: string | null
  status: StatusAbsensi
  keterangan?: string | null
  diubah_oleh?: string | null
  diubah_pada?: string | null
}

export interface RekapHarian {
  tanggal: string
  total: number
  hadir: number
  sakit: number
  izin: number
  alpa: number
  terlambat: number
}

export interface MatriksRecord {
  siswa_id: number
  nisn: string
  nama: string
  status_per_tanggal: Record<string, StatusAbsensi>
}

export interface ImportCsvPayload {
  file: File
  tipe: "siswa" | "kelas" | "wali_kelas"
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
