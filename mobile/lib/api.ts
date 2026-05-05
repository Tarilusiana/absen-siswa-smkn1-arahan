const API_BASE = "http://192.168.100.215:3000/api"

interface FetchOptions extends RequestInit {
  token?: string
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOpts } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOpts,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || "Request failed")
  }

  return data
}

export const api = {
  loginSiswa: (nisn: string, password: string, deviceId: string) =>
    fetchApi<{
      success: boolean
      message: string
      data?: { id: number; nisn: string; nama: string; id_kelas: number; nama_kelas: string; token: string }
    }>("/auth/login/siswa", {
      method: "POST",
      body: JSON.stringify({ nisn, password, device_id: deviceId }),
    }),

  absen: (payload: { nisn: string; latitude: number; longitude: number; jenis: "masuk" | "pulang" }, token: string) =>
    fetchApi<{ success: boolean; message: string }>("/absensi/absen", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    }),

  riwayat: (nisn: string, token: string) =>
    fetchApi<{ success: boolean; data?: { riwayat: Array<{ id: number; tanggal: string; jam_masuk: string | null; jam_pulang: string | null; status: string; keterangan: string | null }> } }>(
      `/absensi/riwayat/${nisn}`,
      { token }
    ),

  serverTime: () =>
    fetchApi<{ success: boolean; data?: { waktu: string } }>("/server/waktu"),
}

export { API_BASE }
