export type StatusAbsensi = "H" | "S" | "I" | "A" | "T"

export interface UserData {
  id: number
  nisn: string
  nama: string
  id_kelas: number
  nama_kelas: string
  token: string
}

export interface AbsensiRecord {
  id: number
  tanggal: string
  jam_masuk: string | null
  jam_pulang: string | null
  status: StatusAbsensi
  keterangan: string | null
}

export interface AbsenPayload {
  nisn: string
  latitude: number
  longitude: number
  jenis: "masuk" | "pulang"
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
